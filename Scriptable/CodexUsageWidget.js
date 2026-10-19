// Codex Usage widget — local iPhone edition for Scriptable.
// Reads the refresh token from Scriptable Keychain and calls OpenAI directly.
// No Cloudflare endpoint is used and no token is sent to this project's server.
// Visual/code portions derive in part from MIT-licensed Codex Usage Scriptable Widgets:
// https://github.com/qian-available/codex-usage-scriptable-widgets

const TOKEN_KEY = "codexUsageLocalRefreshToken.v1";
const ACCOUNT_KEY = "codexUsageLocalAccountId.v1";
const AUTH_BASE = "https://auth.openai.com";
const TOKEN_ENDPOINT = `${AUTH_BASE}/oauth/token`;
const USAGE_ENDPOINT = "https://chatgpt.com/backend-api/wham/usage";
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const REFRESH_AFTER_MINUTES = 10;

const COLORS = {
  background: Color.dynamic(new Color("#FAF8F2"), new Color("#080D20")),
  text: Color.dynamic(new Color("#171923"), new Color("#F5F6FF")),
  muted: Color.dynamic(new Color("#747887"), new Color("#AAB5D4")),
  divider: Color.dynamic(new Color("#E4E1DA"), new Color("#252D52")),
  accent: Color.dynamic(new Color("#6D5CE8"), new Color("#A99AFF")),
  blue: Color.dynamic(new Color("#438FEA"), new Color("#36C9FF")),
  green: Color.dynamic(new Color("#159A78"), new Color("#A277FF")),
  warning: Color.dynamic(new Color("#B56A08"), new Color("#FFC36B")),
  danger: Color.dynamic(new Color("#C63E59"), new Color("#FF8295")),
};

main().catch((error) => {
  console.error(error);
  Script.complete();
});

async function main() {
  let data;
  try {
    if (!config.runsInWidget && !Keychain.contains(TOKEN_KEY)) {
      await authorizeOnDevice();
    } else if (!config.runsInWidget) {
      const alert = new Alert();
      alert.title = "Codex 用量";
      alert.message = "令牌仅保存在本机 Scriptable Keychain。";
      alert.addAction("查询用量");
      alert.addAction("重新授权");
      alert.addCancelAction("取消");
      const choice = await alert.present();
      if (choice === 1) await authorizeOnDevice();
      else if (choice !== 0) throw new Error("操作已取消");
    }
    data = await loadUsage();
  } catch (error) {
    data = { errorMessage: error && error.message ? error.message : "读取失败" };
  }
  const widget = buildWidget(data);
  if (config.runsInWidget) Script.setWidget(widget);
  else await widget.presentMedium();
  Script.complete();
}

async function authorizeOnDevice() {
  const response = await postJSON(`${AUTH_BASE}/api/accounts/deviceauth/usercode`, { client_id: CLIENT_ID });
  const deviceAuthId = response.device_auth_id;
  const userCode = response.user_code || response.usercode;
  const interval = Math.max(3, Number(response.interval) || 5);
  if (!deviceAuthId || !userCode) throw new Error("设备授权服务返回格式无法识别。请稍后重试。");

  const alert = new Alert();
  alert.title = "Codex 设备授权";
  alert.message = `1. 打开授权页面并登录
2. 输入此一次性代码：\n\n${userCode}\n\n授权完成后返回此处。代码约 15 分钟后过期。`;
  alert.addAction("打开授权页面");
  alert.addCancelAction("取消");
  const choice = await alert.present();
  if (choice !== 0) throw new Error("设备授权已取消");
  Safari.open(`${AUTH_BASE}/codex/device`);
  const codeAlert = new Alert();
  codeAlert.title = "输入设备代码";
  codeAlert.message = userCode;
  codeAlert.addAction("我已授权，继续");
  codeAlert.addCancelAction("取消");
  if (await codeAlert.present() !== 0) throw new Error("设备授权已取消");

  const expiresAt = Date.now() + 15 * 60 * 1000;
  let codeData;
  while (Date.now() < expiresAt) {
    try {
      codeData = await postJSON(`${AUTH_BASE}/api/accounts/deviceauth/token`, {
        device_auth_id: deviceAuthId,
        user_code: userCode,
      });
      if (codeData.authorization_code && codeData.code_verifier) break;
    } catch (error) {
      const status = error && error.statusCode;
      if (status !== 403 && status !== 404) throw error;
    }
    await waitSeconds(interval);
  }
  if (!codeData || !codeData.authorization_code || !codeData.code_verifier) {
    throw new Error("设备授权超时。请重新运行脚本获取新代码。");
  }

  const tokenData = await postForm(TOKEN_ENDPOINT, {
    grant_type: "authorization_code",
    code: codeData.authorization_code,
    redirect_uri: `${AUTH_BASE}/deviceauth/callback`,
    client_id: CLIENT_ID,
    code_verifier: codeData.code_verifier,
  });
  if (!tokenData.refresh_token) throw new Error("授权完成但未收到刷新令牌，请重新运行授权。");
  Keychain.set(TOKEN_KEY, tokenData.refresh_token);
  const accountId = extractAccountId(tokenData.id_token || tokenData.access_token);
  if (accountId) Keychain.set(ACCOUNT_KEY, accountId);
}

async function loadUsage() {
  if (!Keychain.contains(TOKEN_KEY)) throw new Error("尚未授权。请在 Scriptable 中运行脚本完成设备授权。");
  const tokenResponse = await postForm(TOKEN_ENDPOINT, {
    grant_type: "refresh_token",
    refresh_token: Keychain.get(TOKEN_KEY),
    client_id: CLIENT_ID,
  });
  if (!tokenResponse.access_token) throw new Error("令牌刷新失败。请在 Scriptable 中选择“重新授权”。");
  if (tokenResponse.refresh_token) Keychain.set(TOKEN_KEY, tokenResponse.refresh_token);

  const req = new Request(USAGE_ENDPOINT);
  req.method = "GET";
  req.headers = { Authorization: `Bearer ${tokenResponse.access_token}`, Accept: "application/json" };
  if (Keychain.contains(ACCOUNT_KEY)) req.headers["ChatGPT-Account-Id"] = Keychain.get(ACCOUNT_KEY);
  req.timeoutInterval = 20;
  const raw = await req.loadJSON();
  return normalizeUsage(raw);
}

async function postJSON(url, body) {
  const req = new Request(url);
  req.method = "POST";
  req.headers = { "Content-Type": "application/json", Accept: "application/json" };
  req.body = JSON.stringify(body);
  req.timeoutInterval = 20;
  try { return await req.loadJSON(); }
  catch (error) {
    const statusError = new Error(`设备授权请求失败（HTTP ${req.response?.statusCode || "网络错误"}）。`);
    statusError.statusCode = req.response?.statusCode;
    throw statusError;
  }
}

async function waitSeconds(seconds) {
  await new Promise((resolve) => Timer.schedule(seconds, false, resolve));
}

function extractAccountId(jwt) {
  if (!jwt || !jwt.includes(".")) return "";
  try {
    let payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4) payload += "=";
    const data = Data.fromBase64String(payload);
    const claims = JSON.parse(data.toRawString());
    const auth = claims["https://api.openai.com/auth"] || claims.auth || {};
    return auth.chatgpt_account_id || auth.account_id || "";
  } catch (_) { return ""; }
}

async function postForm(url, values) {
  const req = new Request(url);
  req.method = "POST";
  req.headers = { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" };
  req.body = Object.keys(values).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(values[key])}`).join("&");
  req.timeoutInterval = 20;
  try { return await req.loadJSON(); }
  catch (error) {
    throw new Error(`OpenAI 令牌请求失败（HTTP ${req.response?.statusCode || "网络错误"}）。请重试或重新授权。`);
  }
}

function normalizeUsage(raw) {
  const rate = raw.rate_limit || raw.rateLimit || {};
  const primary = rate.primary_window || rate.primaryWindow || {};
  const secondary = rate.secondary_window || rate.secondaryWindow || {};
  const fiveHour = normalizeWindow(primary);
  const weekly = normalizeWindow(secondary);
  if (!fiveHour && !weekly) throw new Error("用量接口返回格式无法识别，请稍后重试。");
  return {
    fiveHour: fiveHour || {},
    weekly: weekly || {},
    updatedAtLocal: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    stale: false,
  };
}

function normalizeWindow(windowData) {
  if (!windowData || typeof windowData !== "object") return null;
  const used = Number(windowData.used_percent ?? windowData.usedPercent);
  const remainingPercent = Number.isFinite(used) ? Math.max(0, Math.min(100, Math.round(100 - used))) : NaN;
  let resetAfterSeconds = Number(windowData.reset_after_seconds ?? windowData.resetAfterSeconds);
  const resetAt = windowData.reset_at ?? windowData.resetAt;
  let resetAtMs = NaN;
  if (resetAt !== undefined && resetAt !== null) {
    resetAtMs = typeof resetAt === "number" ? (resetAt < 100000000000 ? resetAt * 1000 : resetAt) : Date.parse(resetAt);
  }
  if (!Number.isFinite(resetAfterSeconds) && Number.isFinite(resetAtMs)) {
    resetAfterSeconds = Math.max(0, Math.round((resetAtMs - Date.now()) / 1000));
  }
  return { remainingPercent, resetAfterSeconds, resetAtMs };
}

function buildWidget(payload) {
  const family = config.widgetFamily || "medium";
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(17, 18, 15, 18);
  widget.refreshAfterDate = new Date(Date.now() + REFRESH_AFTER_MINUTES * 60 * 1000);

  if (payload.errorMessage) {
    widget.addSpacer(8);
    const title = widget.addText("Codex 用量");
    title.font = Font.semiboldSystemFont(16);
    title.textColor = COLORS.text;
    widget.addSpacer(8);
    const message = widget.addText(payload.errorMessage);
    message.font = Font.systemFont(12);
    message.textColor = COLORS.warning;
    message.lineLimit = 4;
    return widget;
  }

  if (family === "small") {
    buildSmall(widget, payload);
  } else if (family === "large") {
    buildLarge(widget, payload);
  } else {
    buildMedium(widget, payload);
  }

  return widget;
}

function buildSmall(widget, payload) {
  addTitleRow(widget, payload);
  widget.addSpacer(5);
  addSmallUsageRow(widget, "5h", payload.fiveHour, COLORS.blue);
  widget.addSpacer(5);
  addSmallUsageRow(widget, "W", payload.weekly, COLORS.green);
}

function addSmallUsageRow(parent, label, windowData, color) {
  const section = parent.addStack();
  section.layoutVertically();

  const valueRow = section.addStack();
  valueRow.layoutHorizontally();
  valueRow.centerAlignContent();

  const labelText = valueRow.addText(label);
  labelText.font = Font.italicSystemFont(18);
  labelText.textColor = COLORS.text;
  valueRow.addSpacer(7);

  const valueText = valueRow.addText(percentText(windowData));
  valueText.font = Font.semiboldSystemFont(23);
  valueText.textColor = colorForRemaining(windowData?.remainingPercent, color);
  valueText.lineLimit = 1;
  valueText.minimumScaleFactor = 0.7;

  section.addSpacer(1);
  const reset = section.addText(resetText(windowData, label));
  reset.font = Font.mediumSystemFont(9);
  reset.textColor = COLORS.muted;
  reset.lineLimit = 1;
  reset.minimumScaleFactor = 0.7;
}

function buildMedium(widget, payload) {
  addTitleRow(widget, payload);
  widget.addSpacer(13);

  const row = widget.addStack();
  row.layoutHorizontally();
  addGaugeBlock(row, "5h", payload.fiveHour, COLORS.blue);
  row.addSpacer(14);
  addDivider(row);
  row.addSpacer(14);
  addGaugeBlock(row, "Week", payload.weekly, COLORS.green);

  widget.addSpacer();
  addFooter(widget, payload);
}

function buildLarge(widget, payload) {
  addTitleRow(widget, payload);
  widget.addSpacer(18);
  addGaugeBlock(widget, "5h", payload.fiveHour, COLORS.blue);
  widget.addSpacer(18);
  addGaugeBlock(widget, "Week", payload.weekly, COLORS.green);
  widget.addSpacer();
  addFooter(widget, payload);
}

function addTitleRow(parent, payload) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const logo = SFSymbol.named("chevron.left.forwardslash.chevron.right").image;
  logo.tintColor = COLORS.accent;
  logo.imageSize = new Size(15, 15);
  row.addImage(logo);
  row.addSpacer(5);

  const title = row.addText("Codex");
  title.font = Font.semiboldSystemFont(15);
  title.textColor = COLORS.text;
}

function addBigValue(parent, label, value, color) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();

  const labelText = row.addText(label);
  labelText.font = Font.italicSystemFont(26);
  labelText.textColor = COLORS.text;

  row.addSpacer(7);

  const valueText = row.addText(value);
  valueText.font = Font.semiboldSystemFont(28);
  valueText.textColor = color;
  valueText.minimumScaleFactor = 0.6;
}

function addGaugeBlock(parent, label, windowData, color) {
  const stack = parent.addStack();
  stack.layoutVertically();
  stack.centerAlignContent();

  const labelText = stack.addText(label);
  labelText.font = Font.mediumSystemFont(12);
  labelText.textColor = COLORS.muted;
  labelText.centerAlignText();

  stack.addSpacer(2);

  const valueText = stack.addText(percentText(windowData));
  valueText.font = Font.semiboldSystemFont(36);
  valueText.textColor = colorForRemaining(windowData?.remainingPercent, color);
  valueText.lineLimit = 1;
  valueText.minimumScaleFactor = 0.5;
  valueText.centerAlignText();

  // Keep the reset time directly under its percentage, centered within its column.
  stack.addSpacer(1);
  const reset = stack.addText(resetText(windowData, label));
  reset.font = Font.mediumSystemFont(10);
  reset.textColor = COLORS.muted;
  reset.lineLimit = 1;
  reset.minimumScaleFactor = 0.75;
  reset.centerAlignText();

  stack.addSpacer(8);
  addProgressBar(stack, windowData?.remainingPercent, color);
}

function addProgressBar(parent, remaining, color) {
  const value = Math.max(0, Math.min(100, Number(remaining ?? 0)));
  const width = config.widgetFamily === "large" ? 285 : 118;
  const height = 7;
  const context = new DrawContext();
  context.size = new Size(width, height);
  context.opaque = false;
  context.respectScreenScale = true;

  const bg = new Path();
  bg.addRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  context.addPath(bg);
  context.setFillColor(COLORS.divider);
  context.fillPath();

  const fg = new Path();
  fg.addRoundedRect(new Rect(0, 0, Math.max(height, width * value / 100), height), height / 2, height / 2);
  context.addPath(fg);
  context.setFillColor(colorForRemaining(value, color));
  context.fillPath();

  parent.addImage(context.getImage());
}

function addDivider(parent) {
  const divider = parent.addStack();
  divider.backgroundColor = COLORS.divider;
  divider.size = new Size(1, 64);
}

function addFooter(parent, payload) {
  const footer = parent.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();

  const text = payload.stale ? `sync ${payload.status || "stale"}` : updatedText(payload.updatedAtLocal);
  const updated = footer.addText(text);
  updated.font = Font.systemFont(10);
  updated.textColor = payload.stale ? COLORS.warning : COLORS.muted;
  updated.lineLimit = 1;
  updated.minimumScaleFactor = 0.75;
}

function percentText(windowData) {
  const value = windowData?.remainingPercent;
  return Number.isFinite(value) ? `${value}%` : "--";
}

function colorForRemaining(value, fallback) {
  if (!Number.isFinite(value)) return COLORS.muted;
  if (value <= 15) return COLORS.danger;
  if (value <= 30) return COLORS.warning;
  return fallback;
}

function resetText(windowData, label) {
  const resetAtMs = Number(windowData?.resetAtMs);
  let date = Number.isFinite(resetAtMs) ? new Date(resetAtMs) : null;
  if (!date) {
    const seconds = Number(windowData?.resetAfterSeconds);
    if (Number.isFinite(seconds)) date = new Date(Date.now() + seconds * 1000);
  }
  if (!date || !Number.isFinite(date.getTime())) return "reset at --:--";
  const formatter = new DateFormatter();
  // Show both local date and time for every reset window.
  formatter.dateFormat = "MM/dd HH:mm";
  return `reset at ${formatter.string(date)}`;
}

function updatedText(value) {
  if (!value) return "updated --";
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `updated ${match[1]}:${match[2]}` : "updated";
}

