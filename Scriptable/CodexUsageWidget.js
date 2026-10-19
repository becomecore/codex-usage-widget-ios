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
// Blue Codex code mark adapted from the user-provided official widget reference.
const CODEX_LOGO_BASE64 = "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";

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

  const logo = Image.fromData(Data.fromBase64String(CODEX_LOGO_BASE64));
  const logoSize = config.widgetFamily === "small" ? 29 : 27;
  logo.imageSize = new Size(logoSize, logoSize);
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

