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
// Transparent Codex logo lockup supplied by the user.
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
  logo.tintColor = COLORS.text;
  const logoWidth = config.widgetFamily === "small" ? 76 : config.widgetFamily === "large" ? 94 : 82;
  const logoAspect = 480 / 126;
  logo.imageSize = new Size(logoWidth, logoWidth / logoAspect);
  row.addImage(logo);
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

