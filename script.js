const SUPABASE_URL = "https://krzfyvhxslntiwdimfco.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WOhbbCxJd3rEAi7bHxtM4w_5I5gjYfk";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const canvas = document.getElementById("pixelCanvas");
const sizeSelect = document.getElementById("canvasSize");
const colorPicker = document.getElementById("colorPicker");
const drawBtn = document.getElementById("drawBtn");
const eraserBtn = document.getElementById("eraserBtn");
const eyedropperBtn = document.getElementById("eyedropperBtn");
const bucketBtn = document.getElementById("bucketBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const startBtn = document.getElementById("startBtn");
const galleryBtn = document.getElementById("galleryBtn");

const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const logoutBtn = document.getElementById("logoutBtn");

const navLinks = document.querySelectorAll(".nav-link");
const adminNavBtn = document.getElementById("adminNavBtn");

const saveBtn = document.getElementById("saveBtn");
const downloadBtn = document.getElementById("downloadBtn");
const artTitle = document.getElementById("artTitle");
const artStory = document.getElementById("artStory");
const galleryGrid = document.getElementById("galleryGrid");
const publishCheckbox = document.getElementById("publishCheckbox");
const editModeNotice = document.getElementById("editModeNotice");

const publicTab = document.getElementById("publicTab");
const myWorksTab = document.getElementById("myWorksTab");
const gallerySubtitle = document.getElementById("gallerySubtitle");
const publicFilterBar = document.getElementById("publicFilterBar");
const filterButtons = document.querySelectorAll(".filter-btn");

const imageUpload = document.getElementById("imageUpload");
const convertImageBtn = document.getElementById("convertImageBtn");
const imagePalette = document.getElementById("imagePalette");
const palettePanel = document.getElementById("palettePanel");
const palettePager = document.getElementById("palettePager");
const palettePrevBtn = document.getElementById("palettePrevBtn");
const paletteNextBtn = document.getElementById("paletteNextBtn");
const palettePageInfo = document.getElementById("palettePageInfo");

const draftDepthWrapper = document.getElementById("draftDepthWrapper");
const draftDepthSlider = document.getElementById("draftDepthSlider");
const draftDepthValue = document.getElementById("draftDepthValue");

const aiPromptInput = document.getElementById("aiPromptInput");
const generateAiDraftBtn = document.getElementById("generateAiDraftBtn");
const aiDraftStatus = document.getElementById("aiDraftStatus");

const artworkModal = document.getElementById("artworkModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalArtworkImage = document.getElementById("modalArtworkImage");
const modalArtworkTitle = document.getElementById("modalArtworkTitle");
const modalArtworkAuthor = document.getElementById("modalArtworkAuthor");
const modalArtworkStory = document.getElementById("modalArtworkStory");

const authModal = document.getElementById("authModal");
const authCloseBtn = document.getElementById("authCloseBtn");
const signInTab = document.getElementById("signInTab");
const signUpTab = document.getElementById("signUpTab");
const authSignupNotice = document.getElementById("authSignupNotice");
const authSignupNoticeText = document.getElementById("authSignupNoticeText");
const authSignupGoSignIn = document.getElementById("authSignupGoSignIn");
const authSignupForgot = document.getElementById("authSignupForgot");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authDisplayName = document.getElementById("authDisplayName");
const displayNameWrapper = document.getElementById("displayNameWrapper");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const authHint = document.getElementById("authHint");

const adminReviewCount = document.getElementById("adminReviewCount");
const adminPublicCount = document.getElementById("adminPublicCount");
const adminTotalCount = document.getElementById("adminTotalCount");
const refreshAdminBtn = document.getElementById("refreshAdminBtn");
const adminReviewGrid = document.getElementById("adminReviewGrid");
const adminPublicGrid = document.getElementById("adminPublicGrid");
const adminAllGrid = document.getElementById("adminAllGrid");

const DEFAULT_DRAFT_DEPTH = 28;
const palettePageSize = 24;
const maxHistory = 60;

let authMode = "signup";
let currentUser = null;
let isAdmin = false;
let currentColor = colorPicker.value;
let currentTool = "brush";
let activeDrawingPointerId = null;
let lastDrawingCellIndex = null;
let currentGalleryMode = "public";
let currentPublicFilter = "all";
let editingArtworkId = null;
let editingArtworkImagePath = null;

let extractedPaletteColors = [];
let currentPalettePage = 1;

let currentArtworkIsAIGenerated = false;
let currentDraftType = "none";
let currentDraftPrompt = "";

let undoStack = [];
let redoStack = [];

const quickCommentOptions = [
  "好可愛",
  "很有故事",
  "配色很美",
  "超有創意",
  "很療癒",
  "想收藏",
  "很有回憶感",
  "風格很棒"
];

function withTimeout(promise, milliseconds, timeoutMessage) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, milliseconds);
  });

  return Promise.race([promise, timeoutPromise]);
}

/* =========================
   Security Helpers
========================= */

const SECURITY_LIMITS = {
  title: 80,
  story: 1000,
  displayName: 40,
  aiPrompt: 500,
  comment: 100,
  fileSizeBytes: 5 * 1024 * 1024
};

const SECURITY_RISK_PATTERNS = [
  /<\s*script/i,
  /<\s*\/\s*script/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /onfocus\s*=/i,
  /oninput\s*=/i,
  /onchange\s*=/i,
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /<\s*svg/i,
  /<\s*img/i,
  /<\s*link/i,
  /<\s*meta/i,
  /drop\s+table/i,
  /delete\s+from/i,
  /insert\s+into/i,
  /union\s+select/i,
  /alter\s+table/i,
  /truncate\s+table/i,
  /select\s+.+\s+from/i,
  /update\s+.+\s+set/i
];

function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

function normalizeForSecurity(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
}

function containsSecurityRisk(value) {
  const text = normalizeForSecurity(value);

  if (!text) {
    return false;
  }

  return SECURITY_RISK_PATTERNS.some(pattern => pattern.test(text));
}

function validatePlainTextField(value, label, maxLength, options = {}) {
  const text = normalizeForSecurity(value);
  const required = Boolean(options.required);

  if (required && !text) {
    return {
      ok: false,
      message: `${label}不可空白。`
    };
  }

  if (text.length > maxLength) {
    return {
      ok: false,
      message: `${label}過長，請限制在 ${maxLength} 字以內。`
    };
  }

  if (containsSecurityRisk(text)) {
    return {
      ok: false,
      message: `${label}含有不安全內容，請移除 HTML、script、事件屬性或 SQL 指令等危險字串。`
    };
  }

  return {
    ok: true,
    value: text
  };
}

function validateArtworkInputs(title, story) {
  const titleResult = validatePlainTextField(title, "作品名稱", SECURITY_LIMITS.title, { required: true });

  if (!titleResult.ok) {
    return titleResult;
  }

  const storyResult = validatePlainTextField(story, "作品說明", SECURITY_LIMITS.story, { required: false });

  if (!storyResult.ok) {
    return storyResult;
  }

  return {
    ok: true,
    title: titleResult.value,
    story: storyResult.value
  };
}

function validateDisplayNameInput(displayName) {
  return validatePlainTextField(displayName, "Display name", SECURITY_LIMITS.displayName, { required: false });
}

function validateAIPromptInput(prompt) {
  return validatePlainTextField(prompt, "AI prompt", SECURITY_LIMITS.aiPrompt, { required: true });
}

function isSafeImageFile(file) {
  if (!file) {
    return {
      ok: false,
      message: "請先選擇一張圖片。"
    };
  }

  const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

  if (!allowedTypes.includes(file.type)) {
    return {
      ok: false,
      message: "圖片格式不支援，請使用 PNG、JPG、WEBP 或 GIF。"
    };
  }

  if (file.size > SECURITY_LIMITS.fileSizeBytes) {
    return {
      ok: false,
      message: "圖片檔案過大，請限制在 5MB 以內。"
    };
  }

  return {
    ok: true
  };
}

function sanitizeFileName(value, fallback = "pixalbum_artwork") {
  const cleaned = normalizeForSecurity(value)
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60)
    .replace(/^_+|_+$/g, "");

  return cleaned || fallback;
}

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeArtworkImageSource(artwork) {
  // 防止資料庫中的 image_url 被惡意竄改為 javascript:、data:text/html 或第三方追蹤網址。
  const raw = typeof artwork?.image_url === "string" ? artwork.image_url.trim() : "";
  if (raw) {
    try {
      const url = new URL(raw);
      const allowedHost = new URL(SUPABASE_URL).host;
      const allowedPathPrefix = "/storage/v1/object/public/artworks/";
      if (url.protocol === "https:" && url.host === allowedHost && url.pathname.startsWith(allowedPathPrefix)) {
        return raw;
      }
    } catch (error) {
      // 非法或不受信任的圖片網址，改由已儲存的像素資料產生預覽。
    }
  }
  return pixelDataToImage(artwork?.pixel_data);
}

function getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

async function resendVerificationEmail(email) {
  const safeEmail = normalizeForSecurity(email);

  if (!safeEmail || !isValidEmailFormat(safeEmail)) {
    alert("請先輸入有效的 Email。");
    return;
  }

  try {
    const { error } = await supabaseClient.auth.resend({
      type: "signup",
      email: safeEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl()
      }
    });

    if (error) {
      throw error;
    }

    alert("驗證信已重新寄出。請到信箱點擊驗證連結後再登入。");
  } catch (error) {
    console.error("Resend verification error:", error);
    alert(`重新寄送驗證信失敗：${error.message || "Unknown error"}`);
  }
}

async function sendPasswordResetEmail() {
  const email = normalizeForSecurity(authEmail.value);

  if (!email || !isValidEmailFormat(email)) {
    alert("請先在 Email 欄位輸入要重設密碼的信箱。");
    return;
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.disabled = true;
    forgotPasswordBtn.textContent = "Sending reset email...";
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl()
    });

    if (error) {
      throw error;
    }

    alert("密碼重設信已寄出。請到信箱點擊連結後，再回到 Pixalbum 設定新密碼。");
  } catch (error) {
    console.error("Password reset email error:", error);
    alert(`寄送密碼重設信失敗：${error.message || "Unknown error"}`);
  } finally {
    if (forgotPasswordBtn) {
      forgotPasswordBtn.disabled = false;
      forgotPasswordBtn.textContent = "Forgot password?";
    }
  }
}


/* =========================
   Auth
========================= */

function isAnonymousUser(user = currentUser) {
  return Boolean(user && (
    user.is_anonymous === true || user.app_metadata?.provider === "anonymous"
  ));
}

function getDisplayNameFromUser(user) {
  if (!user || isAnonymousUser(user)) {
    return "anonymous";
  }

  if (user.user_metadata && user.user_metadata.display_name) {
    return user.user_metadata.display_name;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Pixalbum User";
}

function updateAuthNavbar() {
  if (currentUser && !isAnonymousUser()) {
    signInBtn.classList.add("hidden-panel");
    signUpBtn.classList.add("hidden-panel");
    logoutBtn.classList.remove("hidden-panel");
    logoutBtn.textContent = "Logout";
  } else {
    signInBtn.classList.remove("hidden-panel");
    signUpBtn.classList.remove("hidden-panel");
    logoutBtn.classList.add("hidden-panel");
  }

  if (isAdmin) {
    adminNavBtn.classList.remove("hidden-panel");
  } else {
    adminNavBtn.classList.add("hidden-panel");
  }
  const mobileAdmin = document.getElementById("mobileAdminNavBtn");
  if (mobileAdmin) mobileAdmin.classList.toggle("hidden-panel", !isAdmin);
  document.getElementById("mobileSignInBtn")?.classList.toggle("hidden-panel", Boolean(currentUser && !isAnonymousUser()));
  document.getElementById("mobileSignUpBtn")?.classList.toggle("hidden-panel", Boolean(currentUser && !isAnonymousUser()));
  document.getElementById("mobileLogoutBtn")?.classList.toggle("hidden-panel", !currentUser);
}

async function ensureAnonymousAccount() {
  if (currentUser) return currentUser;
  const { data, error } = await withTimeout(
    supabaseClient.auth.signInAnonymously({ options: { data: { display_name: "anonymous" } } }),
    15000,
    "匿名儲存逾時，請檢查網路後重試。"
  );
  if (error) {
    throw new Error("匿名上傳尚未開啟或目前不可用。請由管理者至 Supabase Auth → Providers 啟用 Anonymous Sign-Ins。詳細資訊：" + error.message);
  }
  currentUser = data?.user || null;
  if (!currentUser) throw new Error("無法建立匿名工作階段，請重新整理後重試。");
  await ensureProfile();
  await checkAdminStatus();
  updateAuthNavbar();
  return currentUser;
}

async function refreshAuthState() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error) {
    console.warn("Get user error:", error.message);
    currentUser = null;
    isAdmin = false;
  } else {
    currentUser = data.user || null;
  }

  if (currentUser) {
    await ensureProfile();
    await checkAdminStatus();
  } else {
    isAdmin = false;
  }

  updateAuthNavbar();
}

async function ensureProfile() {
  if (!currentUser) {
    return;
  }

  const displayName = getDisplayNameFromUser(currentUser);
  const displayNameValidation = validateDisplayNameInput(displayName);

  if (!displayNameValidation.ok) {
    console.warn("Display name blocked:", displayNameValidation.message);
    return;
  }

  const { error } = await supabaseClient
    .from("profiles")
    .upsert({
      id: currentUser.id,
      display_name: displayNameValidation.value || "Pixalbum User",
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.warn("Profile upsert error:", error.message);
  }
}

async function checkAdminStatus() {
  if (!currentUser) {
    isAdmin = false;
    updateAuthNavbar();
    return false;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.warn("Check admin error:", error.message);
    isAdmin = false;
  } else {
    isAdmin = data?.role === "admin";
  }

  updateAuthNavbar();
  return isAdmin;
}

function openAuthModal(mode = "signup") {
  hideAuthSignupNotice();
  authMode = mode;
  updateAuthMode();

  authEmail.value = "";
  authPassword.value = "";
  authDisplayName.value = "";

  authModal.classList.remove("hidden-panel");
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  hideAuthSignupNotice();
  authModal.classList.add("hidden-panel");
  document.body.style.overflow = "";
}

function updateAuthMode() {
  signInTab.classList.remove("active-auth-tab");
  signUpTab.classList.remove("active-auth-tab");

  if (authMode === "signin") {
    signInTab.classList.add("active-auth-tab");
    displayNameWrapper.classList.add("hidden-panel");
    authSubmitBtn.textContent = "Sign In";
    if (forgotPasswordBtn) {
      forgotPasswordBtn.classList.remove("hidden-panel");
    }
    authHint.textContent = "Already have an account? Sign in to manage your artworks.";
  } else {
    signUpTab.classList.add("active-auth-tab");
    displayNameWrapper.classList.remove("hidden-panel");
    authSubmitBtn.textContent = "Sign Up";
    if (forgotPasswordBtn) {
      forgotPasswordBtn.classList.add("hidden-panel");
    }
    authHint.textContent = "New here? Create an account to start saving artworks.";
  }
}

function hideAuthSignupNotice() {
  if (authSignupNotice) {
    authSignupNotice.classList.add("hidden-panel");
    authSignupNotice.classList.remove("confirmed-duplicate");
  }
}

function showAuthSignupNotice(message, isConfirmedDuplicate = false) {
  if (!authSignupNotice || !authSignupNoticeText) {
    // 舊版 HTML 仍被快取時的後備提示。
    alert(message);
    return;
  }

  authSignupNoticeText.textContent = message;
  authSignupNotice.classList.remove("hidden-panel");
  authSignupNotice.classList.toggle("confirmed-duplicate", isConfirmedDuplicate);
}

// 只使用 Supabase Auth 原生註冊回應判斷重複帳號。
// 不查詢 profiles、auth.users，也不重新公開帳號存在性 RPC。
function isDuplicateSignupResponse(data, error) {
  const errorCode = String(error?.code || "").toLowerCase();
  const errorMessage = String(error?.message || "").toLowerCase();

  if (
    errorCode === "email_exists" ||
    errorCode === "user_already_exists" ||
    errorMessage.includes("user already registered") ||
    errorMessage.includes("already been registered") ||
    errorMessage.includes("email already exists")
  ) {
    return true;
  }

  // 在部分 Supabase Email Confirmation 設定下，重複註冊
  // 會回傳一個 identities 為空陣列的混淆使用者物件。
  // 其他不明確回應一律不猜測帳號是否存在。
  return Boolean(
    data?.user &&
    Array.isArray(data.user.identities) &&
    data.user.identities.length === 0
  );
}

function showDuplicateSignupNotice(email) {
  // 保留使用者輸入的 Email，清空密碼，切換到登入模式。
  authMode = "signin";
  authEmail.value = email;
  authPassword.value = "";
  updateAuthMode();
  authHint.textContent =
    "此 Email 已註冊。請登入，若忘記密碼可點選 Forgot password?";
  showAuthSignupNotice(
    "此 Email 已註冊 Pixalbum。請使用 Sign In 登入；如果忘記密碼，請重設密碼。",
    true
  );
}

async function submitAuthForm() {
  const email = normalizeForSecurity(authEmail.value);
  const password = authPassword.value.trim();
  const displayName = normalizeForSecurity(authDisplayName.value);

  if (!email || !isValidEmailFormat(email)) {
    alert("請輸入有效的 Email。");
    return;
  }

  if (!password || password.length < 6) {
    alert("請輸入至少 6 碼密碼。");
    return;
  }

  if (authMode === "signup") {
    const displayNameValidation = validateDisplayNameInput(displayName);

    if (!displayNameValidation.ok) {
      alert(displayNameValidation.message);
      return;
    }
  }

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = authMode === "signin" ? "Signing in..." : "Signing up...";
  let signupDuplicateDetected = false;
  let signupAwaitingEmail = false;
  hideAuthSignupNotice();

  try {
    if (isAnonymousUser()) {
      const willSwitch = confirm("目前正在使用 anonymous 匿名工作階段。切換至其他帳號後，原匿名作品將不會自動移轉，可能無法繼續編輯。確定切換？");
      if (!willSwitch) return;
    }
    if (authMode === "signin") {
      const loginPromise = supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      const { data, error } = await withTimeout(
        loginPromise,
        15000,
        "登入逾時。請檢查網路、Supabase 專案狀態，或重新整理頁面再試。"
      );

      if (error) {
        const message = String(error.message || "").toLowerCase();

        if (message.includes("email not confirmed") || message.includes("confirm")) {
          const resend = confirm("這個 Email 尚未完成驗證。是否重新寄送驗證信？");

          if (resend) {
            await resendVerificationEmail(email);
          }
        }

        throw error;
      }

      currentUser = data.user || null;

      if (!currentUser) {
        throw new Error("登入成功但沒有取得使用者資料，請重新整理頁面後再試。");
      }

      closeAuthModal();
      await ensureProfile();
      await checkAdminStatus();
      updateAuthNavbar();
      await renderGallery();

      if (isAdmin) {
        await renderAdminPage();
      }

      alert("登入成功。");
      return;
    }

    const finalDisplayName = displayName || email.split("@")[0];

    const signupPromise = supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
        data: {
          display_name: finalDisplayName
        }
      }
    });

    const { data, error } = await withTimeout(
      signupPromise,
      15000,
      "註冊逾時。請檢查網路、Supabase 專案狀態，或重新整理頁面再試。"
    );

    if (isDuplicateSignupResponse(data, error)) {
      signupDuplicateDetected = true;
      showDuplicateSignupNotice(email);
      return;
    }

    if (error) {
      throw error;
    }

    if (!data.session) {
      currentUser = null;
      isAdmin = false;
      updateAuthNavbar();
      // 開啟 Email 驗證時，Supabase 對某些已存在帳號回傳模糊結果。
      // 此情況無法由前端安全地證實帳號存在性，因此不能宣稱「已註冊」。
      // 留在視窗內提供明確可執行的登入及密碼重設選項。
      authPassword.value = "";
      signupAwaitingEmail = true;
      showAuthSignupNotice(
        "已提交註冊申請。若這是新帳號，請至信箱收取驗證信；" +
        "若沒有收到信，可能是此 Email 已註冊，請改用登入或忘記密碼功能。"
      );
      authHint.textContent =
        "請檢查垃圾郵件匣；已有帳號可按「前往登入」。";
      return;
    }

    closeAuthModal();

    currentUser = data.user || null;

    if (currentUser) {
      await ensureProfile();
      await checkAdminStatus();
    } else {
      isAdmin = false;
    }

    updateAuthNavbar();
    await renderGallery();

    if (isAdmin) {
      await renderAdminPage();
    }

    alert("註冊完成，已登入 Pixalbum。 ");
  } catch (error) {
    console.error("Auth error:", error);

    // Supabase Auth 的 Invalid login credentials 統一顯示中文提示，
    // 不區分「帳號不存在」和「密碼錯誤」，避免暴露帳號存在資訊。
    const isInvalidLogin = authMode === "signin" && (
      error?.code === "invalid_credentials" ||
      /invalid login credentials/i.test(String(error?.message || ""))
    );

    if (isInvalidLogin) {
      alert("登入失敗：帳號或密碼錯誤，請確認後再試。");
    } else {
      alert(`${authMode === "signin" ? "登入" : "註冊"}失敗：${error?.message || "未知錯誤"}`);
    }
  } finally {
    authSubmitBtn.disabled = false;
    updateAuthMode();
    if (signupDuplicateDetected) {
      authHint.textContent =
        "此 Email 已註冊。請登入，若忘記密碼可點選 Forgot password?";
    } else if (signupAwaitingEmail) {
      authHint.textContent =
        "請檢查垃圾郵件匣；已有帳號可按「前往登入」。";
    }
  }
}

async function handleLogout() {
  const confirmLogout = confirm("確定要登出嗎？");

  if (!confirmLogout) {
    return;
  }

  await supabaseClient.auth.signOut();

  currentUser = null;
  isAdmin = false;
  editingArtworkId = null;
  editingArtworkImagePath = null;

  saveBtn.textContent = "Save Artwork";
  editModeNotice.classList.add("hidden-panel");

  updateAuthNavbar();
  await renderGallery();
  showPage("home");

  alert("已登出。");
}

signInBtn.addEventListener("click", () => {
  openAuthModal("signin");
});

signUpBtn.addEventListener("click", () => {
  openAuthModal("signup");
});

logoutBtn.addEventListener("click", handleLogout);

authCloseBtn.addEventListener("click", closeAuthModal);

authModal.addEventListener("click", event => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

signInTab.addEventListener("click", () => {
  hideAuthSignupNotice();
  authMode = "signin";
  updateAuthMode();
});

signUpTab.addEventListener("click", () => {
  hideAuthSignupNotice();
  authMode = "signup";
  updateAuthMode();
});

authSubmitBtn.addEventListener("click", submitAuthForm);

if (authSignupGoSignIn) {
  authSignupGoSignIn.addEventListener("click", () => {
    hideAuthSignupNotice();
    authMode = "signin";
    authPassword.value = "";
    updateAuthMode();
  });
}

if (authSignupForgot) {
  authSignupForgot.addEventListener("click", () => {
    hideAuthSignupNotice();
    authMode = "signin";
    authPassword.value = "";
    updateAuthMode();
    sendPasswordResetEmail();
  });
}

if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener("click", sendPasswordResetEmail);
}

authEmail.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    submitAuthForm();
  }
});

authPassword.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    submitAuthForm();
  }
});

authDisplayName.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    submitAuthForm();
  }
});

/* =========================
   Page
========================= */

function showPage(pageId) {
  if (pageId === "admin" && !isAdmin) {
    alert("你沒有管理者權限。");
    return;
  }

  const sections = document.querySelectorAll(".page-section");

  sections.forEach(section => {
    section.classList.remove("active-section");
  });

  if (pageId === "home") {
    document.getElementById("home").classList.add("active-section");
    document.getElementById("concept").classList.add("active-section");
  } else {
    const targetSection = document.getElementById(pageId);

    if (targetSection) {
      targetSection.classList.add("active-section");
    }
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function handleStartCreate() {
  // 無須註冊即可畫圖；匿名儲存時才建立受 RLS 保護的匿名登入工作階段。
  showPage("create");
}

navLinks.forEach(link => {
  link.addEventListener("click", async () => {
    const page = link.dataset.page;

    if (page === "create") {
      handleStartCreate();
      return;
    }

    if (page === "gallery") {
      currentGalleryMode = "public";
      updateGalleryTabs();
      await renderGallery();
      showPage("gallery");
      return;
    }

    if (page === "admin") {
      if (!isAdmin) {
        alert("你沒有管理者權限。");
        return;
      }

      await renderAdminPage();
      showPage("admin");
      return;
    }

    if (page === "story") await loadPostcardStamps();
    showPage(page);
  });
});

// 首頁 LOGO 與手機側拉式導覽
const mobileNav = document.getElementById("mobileNav");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mobileNavBackdrop = document.getElementById("mobileNavBackdrop");
function closeMobileMenu() {
  mobileNav?.classList.remove("is-open");
  mobileNav?.setAttribute("aria-hidden", "true");
  mobileMenuToggle?.setAttribute("aria-expanded", "false");
  mobileNavBackdrop?.classList.add("hidden-panel");
}
function openMobileMenu() {
  mobileNav?.classList.add("is-open");
  mobileNav?.setAttribute("aria-hidden", "false");
  mobileMenuToggle?.setAttribute("aria-expanded", "true");
  mobileNavBackdrop?.classList.remove("hidden-panel");
}
mobileMenuToggle?.addEventListener("click", () => {
  if (mobileNav?.classList.contains("is-open")) closeMobileMenu();
  else openMobileMenu();
});
document.getElementById("mobileMenuClose")?.addEventListener("click", closeMobileMenu);
mobileNavBackdrop?.addEventListener("click", closeMobileMenu);
document.getElementById("homeLogo")?.addEventListener("click", () => { closeMobileMenu(); showPage("home"); });
mobileNav?.querySelectorAll("button[data-page]").forEach(button => button.addEventListener("click", closeMobileMenu));
document.getElementById("mobileSignInBtn")?.addEventListener("click", () => { closeMobileMenu(); openAuthModal("signin"); });
document.getElementById("mobileSignUpBtn")?.addEventListener("click", () => { closeMobileMenu(); openAuthModal("signup"); });
document.getElementById("mobileLogoutBtn")?.addEventListener("click", () => { closeMobileMenu(); handleLogout(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMobileMenu(); });

startBtn.addEventListener("click", handleStartCreate);

galleryBtn.addEventListener("click", async () => {
  currentGalleryMode = "public";
  updateGalleryTabs();
  await renderGallery();
  showPage("gallery");
});

/* =========================
   Gallery Controls
========================= */

function updateGalleryTabs() {
  publicTab.classList.remove("active-tab");
  myWorksTab.classList.remove("active-tab");

  if (currentGalleryMode === "public") {
    publicTab.classList.add("active-tab");
    publicFilterBar.classList.remove("hidden-panel");
    gallerySubtitle.textContent = "Explore public pixel memories from creators and anonymous artists.";
  } else {
    myWorksTab.classList.add("active-tab");
    publicFilterBar.classList.add("hidden-panel");
    gallerySubtitle.textContent = "Manage your artworks from Supabase database.";
  }
}

function updateFilterButtons() {
  filterButtons.forEach(button => {
    if (button.dataset.filter === currentPublicFilter) {
      button.classList.add("active-filter");
    } else {
      button.classList.remove("active-filter");
    }
  });
}

publicTab.addEventListener("click", async () => {
  currentGalleryMode = "public";
  updateGalleryTabs();
  await renderGallery();
});

myWorksTab.addEventListener("click", async () => {
  if (!currentUser) {
    alert("請先登入後查看 My Works。");
    return;
  }

  currentGalleryMode = "my";
  updateGalleryTabs();
  await renderGallery();
});

filterButtons.forEach(button => {
  button.addEventListener("click", async () => {
    currentPublicFilter = button.dataset.filter;
    updateFilterButtons();
    await renderGallery();
  });
});

/* =========================
   Modal
========================= */

function openArtworkModal(artwork) {
  modalArtworkImage.src = safeArtworkImageSource(artwork);
  modalArtworkTitle.textContent = artwork.title || "Untitled Artwork";

  const author = artwork.display_name || artwork.author_name || "匿名使用者";
  const timeText = artwork.created_at ? new Date(artwork.created_at).toLocaleString() : "";

  modalArtworkAuthor.textContent = `${author} · ${timeText}`;
  modalArtworkStory.textContent = artwork.story || "尚未新增作品說明。";

  artworkModal.classList.remove("hidden-panel");
  document.body.style.overflow = "hidden";
}

function closeArtworkModal() {
  artworkModal.classList.add("hidden-panel");
  modalArtworkImage.src = "";
  document.body.style.overflow = "";
}

modalCloseBtn.addEventListener("click", closeArtworkModal);

artworkModal.addEventListener("click", event => {
  if (event.target === artworkModal) {
    closeArtworkModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (!artworkModal.classList.contains("hidden-panel")) {
      closeArtworkModal();
    }

    if (!authModal.classList.contains("hidden-panel")) {
      closeAuthModal();
    }
  }
});


/* =========================
   Gallery Click Delegation
========================= */

galleryGrid.addEventListener("click", async event => {
  const button = event.target.closest("button");

  if (button) {
    event.preventDefault();
    event.stopPropagation();

    const id = button.dataset.id;

    if (button.classList.contains("detail-art-btn")) {
      const artwork = await fetchArtworkById(id);
      if (artwork) {
        openArtworkModal(artwork);
      }
      return;
    }

    if (button.classList.contains("like-art-btn")) {
      await likeArtworkById(id);
      return;
    }

    if (button.classList.contains("report-art-btn")) {
      await reportArtworkById(id);
      return;
    }

    if (button.classList.contains("quick-comment-btn")) {
      await commentArtworkById(id, button.dataset.comment);
      return;
    }

    if (button.classList.contains("edit-art-btn")) {
      await editArtworkById(id);
      return;
    }

    if (button.classList.contains("download-art-btn")) {
      await downloadArtworkById(id);
      return;
    }

    if (button.classList.contains("delete-art-btn")) {
      await deleteArtworkById(id);
      return;
    }

    if (button.classList.contains("toggle-public-btn")) {
      await togglePublicById(id);
      return;
    }
  }

  const card = event.target.closest(".art-card");

  if (card) {
    card.classList.toggle("flipped");
  }
});

async function fetchArtworkById(id) {
  const { data, error } = await supabaseClient
    .from("artworks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(`讀取作品失敗：${error.message}`);
    return null;
  }

  return data;
}

/* =========================
   History
========================= */

function getCanvasSnapshot() {
  const cells = Array.from(document.querySelectorAll(".pixel-cell")).map(cell => {
    return {
      index: cell.dataset.index,
      color: cell.dataset.color,
      userColor: cell.dataset.userColor,
      referenceColor: cell.dataset.referenceColor,
      hasUserPaint: cell.dataset.hasUserPaint
    };
  });

  return {
    size: Number(sizeSelect.value),
    cells,
    currentColor,
    currentTool,
    extractedPaletteColors: [...extractedPaletteColors],
    currentPalettePage,
    currentDraftType,
    currentDraftPrompt,
    draftDepth: Number(draftDepthSlider.value || DEFAULT_DRAFT_DEPTH),
    paletteVisible: !palettePanel.classList.contains("hidden-panel"),
    draftToolsVisible: !draftDepthWrapper.classList.contains("hidden-panel")
  };
}

function applyCanvasSnapshot(snapshot) {
  // Undo / Redo 只還原畫布內容與底稿狀態，不改變使用者目前選取的筆刷顏色與工具。
  // 避免使用 Undo 後，筆刷顏色被還原成舊快照中的白色或預設色。
  const preservedColor = currentColor || colorPicker.value || "#1f4e79";
  const preservedTool = currentTool || "brush";

  sizeSelect.value = String(snapshot.size);
  createCanvas(snapshot.size);

  const cells = document.querySelectorAll(".pixel-cell");

  snapshot.cells.forEach((cellData, index) => {
    const cell = cells[index];

    if (!cell) {
      return;
    }

    cell.dataset.index = cellData.index;
    cell.dataset.color = cellData.color || "#ffffff";
    cell.dataset.userColor = cellData.userColor || "";
    cell.dataset.referenceColor = cellData.referenceColor || "";
    cell.dataset.hasUserPaint = cellData.hasUserPaint || "false";
  });

  currentColor = preservedColor;
  colorPicker.value = preservedColor;
  updateSelectedPaletteColor(preservedColor);

  extractedPaletteColors = [...(snapshot.extractedPaletteColors || [])];
  currentPalettePage = snapshot.currentPalettePage || 1;
  currentDraftType = snapshot.currentDraftType || "none";
  currentDraftPrompt = snapshot.currentDraftPrompt || "";

  draftDepthSlider.value = String(snapshot.draftDepth ?? DEFAULT_DRAFT_DEPTH);
  updateDraftDepthLabel();

  if (snapshot.paletteVisible) {
    palettePanel.classList.remove("hidden-panel");
  } else {
    palettePanel.classList.add("hidden-panel");
  }

  if (snapshot.draftToolsVisible) {
    draftDepthWrapper.classList.remove("hidden-panel");
  } else {
    draftDepthWrapper.classList.add("hidden-panel");
  }

  if (extractedPaletteColors.length > 0) {
    renderImagePalettePage();
  } else {
    clearPalette();
  }

  setTool(preservedTool);
  renderAllCellDisplays();
  updateHistoryButtons();
}

function pushUndoState() {
  undoStack.push(getCanvasSnapshot());

  if (undoStack.length > maxHistory) {
    undoStack.shift();
  }

  redoStack = [];
  updateHistoryButtons();
}

function undoAction() {
  if (undoStack.length === 0) {
    return;
  }

  redoStack.push(getCanvasSnapshot());
  const previousState = undoStack.pop();
  applyCanvasSnapshot(previousState);
}

function redoAction() {
  if (redoStack.length === 0) {
    return;
  }

  undoStack.push(getCanvasSnapshot());
  const nextState = redoStack.pop();
  applyCanvasSnapshot(nextState);
}

function updateHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

undoBtn.addEventListener("click", undoAction);
redoBtn.addEventListener("click", redoAction);

/* =========================
   Drawing Tools
========================= */

function setTool(toolName) {
  currentTool = toolName;

  drawBtn.classList.remove("active-tool");
  eraserBtn.classList.remove("active-tool");
  eyedropperBtn.classList.remove("active-tool");
  bucketBtn.classList.remove("active-tool");

  if (toolName === "brush") {
    drawBtn.classList.add("active-tool");
  }

  if (toolName === "eraser") {
    eraserBtn.classList.add("active-tool");
  }

  if (toolName === "eyedropper") {
    eyedropperBtn.classList.add("active-tool");
  }

  if (toolName === "bucket") {
    bucketBtn.classList.add("active-tool");
  }
}

drawBtn.addEventListener("click", () => setTool("brush"));
eraserBtn.addEventListener("click", () => setTool("eraser"));
eyedropperBtn.addEventListener("click", () => setTool("eyedropper"));
bucketBtn.addEventListener("click", () => setTool("bucket"));

function createCanvas(size) {
  canvas.innerHTML = "";
  canvas.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  canvas.style.gridTemplateRows = `repeat(${size}, 1fr)`;

  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");

    cell.classList.add("pixel-cell");
    cell.dataset.index = String(i);
    cell.dataset.color = "#ffffff";
    cell.dataset.userColor = "";
    cell.dataset.referenceColor = "";
    cell.dataset.hasUserPaint = "false";
    cell.style.backgroundColor = "#ffffff";

    canvas.appendChild(cell);
  }
}

/* =========================
   Mobile & Desktop Canvas Drawing
   Pointer Events work with mouse, touch and stylus.
   Page scrolling stays enabled outside #pixelCanvas.
========================= */

function getDrawingCellAtPoint(clientX, clientY) {
  const element = document.elementFromPoint(clientX, clientY);
  if (!element) return null;

  const cell = element.closest(".pixel-cell");
  return cell && canvas.contains(cell) ? cell : null;
}

function drawLineBetweenCells(fromIndex, toIndex) {
  const size = Number(sizeSelect.value);
  const cells = canvas.children;
  let x0 = fromIndex % size;
  let y0 = Math.floor(fromIndex / size);
  const x1 = toIndex % size;
  const y1 = Math.floor(toIndex / size);

  // Bresenham interpolation prevents gaps when a finger moves fast,
  // especially with 32x32 / 64x64 pixel grids.
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx - dy;

  while (true) {
    const cell = cells[y0 * size + x0];
    if (cell) handleCellAction(cell);
    if (x0 === x1 && y0 === y1) break;

    const doubledError = 2 * error;
    if (doubledError > -dy) {
      error -= dy;
      x0 += sx;
    }
    if (doubledError < dx) {
      error += dx;
      y0 += sy;
    }
  }
}

function finishDrawingPointer(event) {
  if (event.pointerId !== activeDrawingPointerId) return;

  activeDrawingPointerId = null;
  lastDrawingCellIndex = null;

  if (canvas.hasPointerCapture && canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

canvas.addEventListener("pointerdown", event => {
  // Ignore secondary mouse buttons and additional fingers.
  if ((event.pointerType === "mouse" && event.button !== 0) ||
      event.isPrimary === false || activeDrawingPointerId !== null) return;

  const cell = getDrawingCellAtPoint(event.clientX, event.clientY);
  if (!cell) return;

  event.preventDefault(); // Prevent touch selection and compatibility mouse actions.
  activeDrawingPointerId = event.pointerId;
  lastDrawingCellIndex = Number(cell.dataset.index);

  if (currentTool === "brush" || currentTool === "eraser" || currentTool === "bucket") {
    // One Undo step per continuous finger / pen / mouse stroke.
    pushUndoState();
  }

  handleCellAction(cell);

  // Keep receiving events if the finger briefly crosses cell boundaries.
  if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", event => {
  if (event.pointerId !== activeDrawingPointerId) return;
  if (currentTool !== "brush" && currentTool !== "eraser") return;

  // If the mouse button was released outside the browser, end the stroke.
  if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
    finishDrawingPointer(event);
    return;
  }

  // Pointer capture keeps event delivery consistent; elementFromPoint still
  // locates the real grid cell beneath the finger or stylus.
  const cell = getDrawingCellAtPoint(event.clientX, event.clientY);
  if (!cell) {
    lastDrawingCellIndex = null; // Don't connect strokes across areas outside the canvas.
    return;
  }

  const currentIndex = Number(cell.dataset.index);
  if (lastDrawingCellIndex === null) {
    handleCellAction(cell);
  } else if (lastDrawingCellIndex !== currentIndex) {
    drawLineBetweenCells(lastDrawingCellIndex, currentIndex);
  }
  lastDrawingCellIndex = currentIndex;
});

canvas.addEventListener("pointerup", finishDrawingPointer);
canvas.addEventListener("pointercancel", finishDrawingPointer);
canvas.addEventListener("lostpointercapture", finishDrawingPointer);
canvas.addEventListener("contextmenu", event => event.preventDefault());

function handleCellAction(cell) {
  if (currentTool === "brush") {
    paintCell(cell);
    return;
  }

  if (currentTool === "eraser") {
    eraseCell(cell);
    return;
  }

  if (currentTool === "eyedropper") {
    pickColorFromCell(cell);
    return;
  }

  if (currentTool === "bucket") {
    bucketFill(cell);
    return;
  }
}

function paintCell(cell) {
  cell.dataset.color = currentColor;
  cell.dataset.userColor = currentColor;
  cell.dataset.hasUserPaint = "true";
  cell.style.backgroundColor = currentColor;
}

function eraseCell(cell) {
  cell.dataset.userColor = "";
  cell.dataset.hasUserPaint = "false";
  renderCellDisplay(cell);
}

function pickColorFromCell(cell) {
  let pickedColor = "#ffffff";

  if (cell.dataset.hasUserPaint === "true" && cell.dataset.userColor) {
    pickedColor = cell.dataset.userColor;
  } else if (cell.dataset.referenceColor) {
    pickedColor = cell.dataset.referenceColor;
  }

  currentColor = pickedColor;
  colorPicker.value = pickedColor;
  updateSelectedPaletteColor(pickedColor);
  setTool("brush");
}

function getBucketKey(cell) {
  if (cell.dataset.hasUserPaint === "true") {
    return `user:${cell.dataset.userColor || "#ffffff"}`;
  }

  if (cell.dataset.referenceColor) {
    return `ref:${cell.dataset.referenceColor}`;
  }

  return "empty:#ffffff";
}

function bucketFill(startCell) {
  const cells = Array.from(document.querySelectorAll(".pixel-cell"));
  const size = Number(sizeSelect.value);
  const startIndex = Number(startCell.dataset.index);
  const targetKey = getBucketKey(startCell);
  const visited = new Set();
  const queue = [startIndex];

  while (queue.length > 0) {
    const index = queue.shift();

    if (visited.has(index)) {
      continue;
    }

    visited.add(index);

    const cell = cells[index];

    if (!cell || getBucketKey(cell) !== targetKey) {
      continue;
    }

    paintCell(cell);

    const x = index % size;
    const y = Math.floor(index / size);
    const neighbors = [];

    if (x > 0) neighbors.push(index - 1);
    if (x < size - 1) neighbors.push(index + 1);
    if (y > 0) neighbors.push(index - size);
    if (y < size - 1) neighbors.push(index + size);

    neighbors.forEach(neighborIndex => {
      if (!visited.has(neighborIndex)) {
        queue.push(neighborIndex);
      }
    });
  }
}

colorPicker.addEventListener("input", event => {
  currentColor = event.target.value;
  setTool("brush");
  updateSelectedPaletteColor(currentColor);
});

clearBtn.addEventListener("click", () => {
  pushUndoState();

  currentArtworkIsAIGenerated = false;
  currentDraftType = "none";
  currentDraftPrompt = "";

  createCanvas(Number(sizeSelect.value));
  clearPalette();
  hideDraftTools();
  setTool("brush");
});

sizeSelect.addEventListener("change", event => {
  const size = Number(event.target.value);

  pushUndoState();

  currentArtworkIsAIGenerated = false;
  currentDraftType = "none";
  currentDraftPrompt = "";

  createCanvas(size);
  clearPalette();
  hideDraftTools();
  setTool("brush");

  if (aiDraftStatus) {
    aiDraftStatus.textContent = `Canvas changed to ${size} × ${size}. AI generation will now follow this size.`;
  }
});

/* =========================
   Reference Depth
========================= */

function updateDraftDepthLabel() {
  draftDepthValue.textContent = `${draftDepthSlider.value}%`;
}

function makeReferenceColor(hexColor) {
  if (!hexColor || hexColor.toLowerCase() === "#ffffff") {
    return "#ffffff";
  }

  const depthPercent = Number(draftDepthSlider.value || 0);

  if (depthPercent <= 0) {
    return "#ffffff";
  }

  const keepColorRatio = depthPercent / 100;
  const whiteMixAmount = 1 - keepColorRatio;

  return mixWithWhite(hexColor, whiteMixAmount);
}

function renderCellDisplay(cell) {
  if (cell.dataset.hasUserPaint === "true") {
    cell.style.backgroundColor = cell.dataset.userColor || "#ffffff";
    return;
  }

  const referenceColor = cell.dataset.referenceColor;
  const draftDepth = Number(draftDepthSlider.value || 0);

  if (referenceColor && draftDepth > 0) {
    cell.style.backgroundColor = makeReferenceColor(referenceColor);
  } else {
    cell.style.backgroundColor = "#ffffff";
  }

  cell.dataset.color = "#ffffff";
}

function renderAllCellDisplays() {
  const cells = document.querySelectorAll(".pixel-cell");
  cells.forEach(cell => renderCellDisplay(cell));
}

draftDepthSlider.addEventListener("input", () => {
  updateDraftDepthLabel();
  renderAllCellDisplays();
});

/* =========================
   Image Processing
========================= */

function getPaletteLimitByCanvasSize(size) {
  if (size <= 16) return 10;
  if (size <= 32) return 18;
  return 28;
}

function getQuantizeStepByCanvasSize(size) {
  if (size <= 16) return 40;
  if (size <= 32) return 28;
  return 20;
}

function boostContrastColor(hexColor, contrastFactor = 1.18) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff";

  const adjust = value => {
    const normalized = (value / 255 - 0.5) * contrastFactor + 0.5;
    return Math.round(Math.max(0, Math.min(1, normalized)) * 255);
  };

  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}

function darkenHex(hexColor, amount = 0.18) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return hexColor;

  return rgbToHex(
    Math.round(rgb.r * (1 - amount)),
    Math.round(rgb.g * (1 - amount)),
    Math.round(rgb.b * (1 - amount))
  );
}

function quantizeColorByStep(hexColor, step) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff";

  const q = value => Math.round(value / step) * step;

  return rgbToHex(
    Math.min(255, q(rgb.r)),
    Math.min(255, q(rgb.g)),
    Math.min(255, q(rgb.b))
  );
}

function findNearestPaletteColor(targetColor, palette) {
  if (!palette.length) {
    return targetColor;
  }

  let nearest = palette[0];
  let nearestDistance = colorDistance(targetColor, nearest);

  for (let i = 1; i < palette.length; i++) {
    const distance = colorDistance(targetColor, palette[i]);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = palette[i];
    }
  }

  return nearest;
}

function preserveEdges(colorGrid, size) {
  const result = [...colorGrid];

  for (let index = 0; index < colorGrid.length; index++) {
    const color = colorGrid[index];

    if (!color || color.toLowerCase() === "#ffffff") {
      continue;
    }

    const x = index % size;
    const y = Math.floor(index / size);

    const neighbors = [];

    if (x > 0) neighbors.push(colorGrid[index - 1]);
    if (x < size - 1) neighbors.push(colorGrid[index + 1]);
    if (y > 0) neighbors.push(colorGrid[index - size]);
    if (y < size - 1) neighbors.push(colorGrid[index + size]);

    let edgeCount = 0;

    neighbors.forEach(neighborColor => {
      if (!neighborColor) {
        return;
      }

      if (colorDistance(color, neighborColor) > 22) {
        edgeCount++;
      }
    });

    if (edgeCount >= 2) {
      const darkenAmount = size <= 16 ? 0.28 : size <= 32 ? 0.22 : 0.16;
      result[index] = darkenHex(color, darkenAmount);
    }
  }

  return result;
}

function processImageToPixelColors(imageData, size) {
  const pixels = [];
  const rawColors = [];
  const contrastFactor = size <= 16 ? 1.26 : size <= 32 ? 1.18 : 1.12;
  const step = getQuantizeStepByCanvasSize(size);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    if (a < 20) {
      pixels.push("#ffffff");
      continue;
    }

    let color = rgbToHex(r, g, b);
    color = boostContrastColor(color, contrastFactor);
    color = quantizeColorByStep(color, step);

    pixels.push(color);

    if (color.toLowerCase() !== "#ffffff") {
      rawColors.push(color);
    }
  }

  const paletteLimit = getPaletteLimitByCanvasSize(size);
  const palette = extractMainColors(rawColors, paletteLimit);

  const limitedColors = pixels.map(color => {
    if (color.toLowerCase() === "#ffffff") return "#ffffff";
    return findNearestPaletteColor(color, palette);
  });

  const outlinedColors = preserveEdges(limitedColors, size);

  return {
    colors: outlinedColors,
    palette: extractMainColors(outlinedColors.filter(color => color !== "#ffffff"), 96)
  };
}

// ===== START PART 3 / 4 =====

function applyImageElementToPixelDraft(img) {
  const size = Number(sizeSelect.value);

  createCanvas(size);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = size;
  tempCanvas.height = size;

  const ctx = tempCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const scale = Math.max(size / img.width, size / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const dx = (size - drawWidth) / 2;
  const dy = (size - drawHeight) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

  const imageData = ctx.getImageData(0, 0, size, size);
  const processed = processImageToPixelColors(imageData, size);
  const cells = document.querySelectorAll(".pixel-cell");

  cells.forEach((cell, index) => {
    const color = processed.colors[index] || "#ffffff";

    cell.dataset.referenceColor = color;
    cell.dataset.userColor = "";
    cell.dataset.hasUserPaint = "false";
    cell.dataset.color = "#ffffff";

    renderCellDisplay(cell);
  });

  extractedPaletteColors = processed.palette;
  currentPalettePage = 1;
  renderImagePalettePage({ autoSelectFirst: true });

  showDraftTools();
  updateDraftDepthLabel();
  setTool("brush");
  updateHistoryButtons();
}

function convertImageToPixelDraft() {
  const file = imageUpload.files[0];
  const fileCheck = isSafeImageFile(file);

  if (!fileCheck.ok) {
    alert(fileCheck.message);
    return;
  }

  currentArtworkIsAIGenerated = false;

  pushUndoState();

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      applyImageElementToPixelDraft(img);
      currentDraftType = "image";
      currentDraftPrompt = "";
      alert("圖片已轉換為較清晰的像素參考底稿。");
    };

    img.onerror = function () {
      alert("圖片載入失敗，請重新選擇圖片。");
    };

    img.src = event.target.result;
  };

  reader.onerror = function () {
    alert("圖片讀取失敗，請重新選擇圖片。");
  };

  reader.readAsDataURL(file);
}

convertImageBtn.addEventListener("click", convertImageToPixelDraft);

/* =========================
   AI Draft
========================= */

function buildAIPromptByCanvasSize(userPrompt) {
  const size = Number(sizeSelect.value);
  const safePrompt = normalizeForSecurity(userPrompt);

  let sizeGuide = "";
  let detailGuide = "";

  if (size === 16) {
    sizeGuide = "Target canvas: 16x16.";
    detailGuide = "Use a very simple icon-like composition, a strong silhouette, minimal details, and about 6 to 10 flat colors.";
  } else if (size === 32) {
    sizeGuide = "Target canvas: 32x32.";
    detailGuide = "Use a clear and readable small pixel-art composition, simple face/body features, clean outlines, and about 8 to 16 flat colors.";
  } else {
    sizeGuide = "Target canvas: 64x64.";
    detailGuide = "Use a slightly richer but still pixel-friendly composition, clean outlines, no tiny noisy details, and about 12 to 24 flat colors.";
  }

  return `
Create a clean pixel-art reference image for manual tracing.

User request: ${safePrompt}

${sizeGuide}
${detailGuide}

Requirements:
- centered subject
- clear dark outline
- hard edges
- high contrast
- flat colors
- limited palette
- no blur
- no gradient-heavy shading
- no watercolor effect
- no photorealism
- no text
- no interface elements
- simple or clean background
- must convert well into a ${size}x${size} pixel draft
- preserve recognizable contour lines and major shapes
  `.trim();
}

async function generateAIPixelDraft() {
  if (!currentUser || isAnonymousUser()) {
    alert("AI 生成需使用正式帳號登入，以防止匿名濫用 API 額度。匿名使用者仍可繪圖、轉換圖片並儲存作品。");
    return;
  }

  const promptValidation = validateAIPromptInput(aiPromptInput.value);

  if (!promptValidation.ok) {
    alert(promptValidation.message);
    return;
  }

  const userPrompt = promptValidation.value;
  const size = Number(sizeSelect.value);
  const finalPrompt = buildAIPromptByCanvasSize(userPrompt);

  generateAiDraftBtn.disabled = true;
  generateAiDraftBtn.textContent = "Generating...";
  aiDraftStatus.className = "ai-draft-status loading";
  aiDraftStatus.textContent = `AI 正在根據 ${size} × ${size} 畫布生成較清晰的像素底稿，請稍等約 10～30 秒...`;

  try {
    pushUndoState();

    const generatePromise = supabaseClient.functions.invoke("generate-pixel-draft", {
      body: {
        prompt: finalPrompt,
        userPrompt,
        canvasSize: size
      }
    });

    const { data, error } = await withTimeout(
      generatePromise,
      45000,
      "AI 生成逾時。請檢查 generate-pixel-draft Function、OpenAI 額度或網路狀態。"
    );

    if (error) {
      throw error;
    }

    if (!data || !data.imageBase64) {
      throw new Error("AI 沒有回傳圖片。");
    }

    await new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = function () {
        applyImageElementToPixelDraft(img);
        resolve();
      };

      img.onerror = function () {
        reject(new Error("AI 圖片載入失敗。"));
      };

      img.src = `data:image/png;base64,${data.imageBase64}`;
    });

    currentDraftType = "ai";
    currentDraftPrompt = userPrompt;

    aiDraftStatus.className = "ai-draft-status success";
    aiDraftStatus.textContent = `AI 底稿已生成，並已依 ${size} × ${size} 畫布轉為較清晰的像素參考底稿。`;

    currentArtworkIsAIGenerated = true;

alert("AI 底稿已生成完成。");
  } catch (error) {
    console.error("AI draft error:", error);
    aiDraftStatus.className = "ai-draft-status error";
    aiDraftStatus.textContent = "AI 生成失敗，請檢查 Edge Function / API 額度。";
    alert(`AI 生成底稿失敗：${error.message || "Unknown error"}`);
  } finally {
    generateAiDraftBtn.disabled = false;
    generateAiDraftBtn.textContent = "Generate AI Draft";
  }
}

generateAiDraftBtn.addEventListener("click", generateAIPixelDraft);

aiPromptInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    generateAIPixelDraft();
  }
});

/* =========================
   Draft Tools
========================= */

function showDraftTools() {
  palettePanel.classList.remove("hidden-panel");
  draftDepthWrapper.classList.remove("hidden-panel");
}

function hideDraftTools() {
  palettePanel.classList.add("hidden-panel");
  draftDepthWrapper.classList.add("hidden-panel");
  draftDepthSlider.value = String(DEFAULT_DRAFT_DEPTH);
  updateDraftDepthLabel();
  palettePager.classList.add("hidden-panel");
}

/* =========================
   Color Helpers
========================= */

function mixWithWhite(hexColor, amount) {
  const rgb = hexToRgb(hexColor);

  if (!rgb) {
    return "#ffffff";
  }

  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);

  return rgbToHex(r, g, b);
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(value => {
    const safeValue = Math.max(0, Math.min(255, value));
    const hex = safeValue.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function hexToRgb(hexColor) {
  const cleanHex = hexColor.replace("#", "");

  if (cleanHex.length !== 6) {
    return null;
  }

  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  };
}

function colorDistance(colorA, colorB) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  if (!a || !b) {
    return 999;
  }

  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function extractMainColors(colors, limit) {
  const counts = {};

  colors.forEach(color => {
    if (!color || color.toLowerCase() === "#ffffff") {
      return;
    }

    counts[color] = (counts[color] || 0) + 1;
  });

  const sortedColors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const diverseColors = [];

  sortedColors.forEach(color => {
    const isDifferentEnough = diverseColors.every(existingColor => {
      return colorDistance(color, existingColor) > 18;
    });

    if (isDifferentEnough) {
      diverseColors.push(color);
    }
  });

  return diverseColors.slice(0, limit);
}

function renderImagePalettePage(options = {}) {
  imagePalette.innerHTML = "";

  const shouldAutoSelectFirst = options.autoSelectFirst === true;

  if (!extractedPaletteColors.length) {
    imagePalette.innerHTML = `<span class="palette-empty">No colors found</span>`;
    palettePager.classList.add("hidden-panel");
    return;
  }

  const totalPages = Math.ceil(extractedPaletteColors.length / palettePageSize);
  const startIndex = (currentPalettePage - 1) * palettePageSize;
  const pageColors = extractedPaletteColors.slice(startIndex, startIndex + palettePageSize);

  pageColors.forEach(color => {
    const button = document.createElement("button");
    button.classList.add("palette-color");
    button.type = "button";
    button.style.backgroundColor = color;
    button.title = color;
    button.dataset.color = color;

    button.addEventListener("click", () => {
      currentColor = color;
      colorPicker.value = color;
      setTool("brush");
      updateSelectedPaletteColor(color);
    });

    imagePalette.appendChild(button);
  });

  palettePageInfo.textContent = `Page ${currentPalettePage} / ${totalPages}`;
  palettePrevBtn.disabled = currentPalettePage <= 1;
  paletteNextBtn.disabled = currentPalettePage >= totalPages;

  if (totalPages > 1) {
    palettePager.classList.remove("hidden-panel");
  } else {
    palettePager.classList.add("hidden-panel");
  }

  if (shouldAutoSelectFirst && currentPalettePage === 1 && pageColors.length > 0) {
    currentColor = pageColors[0];
    colorPicker.value = pageColors[0];
  }

  updateSelectedPaletteColor(currentColor);
}

palettePrevBtn.addEventListener("click", () => {
  if (currentPalettePage > 1) {
    currentPalettePage -= 1;
    renderImagePalettePage();
  }
});

paletteNextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(extractedPaletteColors.length / palettePageSize);

  if (currentPalettePage < totalPages) {
    currentPalettePage += 1;
    renderImagePalettePage();
  }
});

function updateSelectedPaletteColor(color) {
  const buttons = document.querySelectorAll(".palette-color");

  buttons.forEach(button => {
    if (button.dataset.color.toLowerCase() === color.toLowerCase()) {
      button.classList.add("selected-color");
    } else {
      button.classList.remove("selected-color");
    }
  });
}

function clearPalette() {
  extractedPaletteColors = [];
  currentPalettePage = 1;
  imagePalette.innerHTML = `<span class="palette-empty">Upload image or generate AI draft first</span>`;
  palettePager.classList.add("hidden-panel");
}

/* =========================
   Pixel Data
========================= */

function getPixelData() {
  const cells = document.querySelectorAll(".pixel-cell");
  const colors = [];

  cells.forEach(cell => {
    if (cell.dataset.hasUserPaint === "true") {
      colors.push(cell.dataset.userColor || "#ffffff");
    } else {
      colors.push("#ffffff");
    }
  });

  return {
    size: Number(sizeSelect.value),
    colors
  };
}

function loadPixelDataToCanvas(pixelData) {
  if (!pixelData || !pixelData.size || !Array.isArray(pixelData.colors)) {
    return;
  }

  sizeSelect.value = String(pixelData.size);
  createCanvas(pixelData.size);

  const cells = document.querySelectorAll(".pixel-cell");

  pixelData.colors.forEach((color, index) => {
    const cell = cells[index];

    if (!cell) {
      return;
    }

    const finalColor = color || "#ffffff";

    if (finalColor.toLowerCase() !== "#ffffff") {
      cell.dataset.color = finalColor;
      cell.dataset.userColor = finalColor;
      cell.dataset.hasUserPaint = "true";
      cell.style.backgroundColor = finalColor;
    } else {
      cell.dataset.color = "#ffffff";
      cell.dataset.userColor = "";
      cell.dataset.hasUserPaint = "false";
      cell.style.backgroundColor = "#ffffff";
    }
  });
}

function getCurrentDraftData() {
  const cells = Array.from(document.querySelectorAll(".pixel-cell"));
  const referenceColors = cells.map(cell => cell.dataset.referenceColor || "");
  const hasDraft = referenceColors.some(color => color && color.toLowerCase() !== "#ffffff");

  if (!hasDraft) {
    return null;
  }

  return {
    size: Number(sizeSelect.value),
    colors: referenceColors,
    type: currentDraftType || "unknown",
    prompt: currentDraftPrompt || ""
  };
}

function applySavedDraftToCanvas(artwork) {
  const draftData = artwork?.draft_data;

  if (!draftData || !draftData.size || !Array.isArray(draftData.colors)) {
    currentDraftType = "none";
    currentDraftPrompt = "";
    clearPalette();
    hideDraftTools();
    return;
  }

  const currentSize = Number(sizeSelect.value);

  if (Number(draftData.size) !== currentSize) {
    console.warn("Draft size does not match canvas size. Draft skipped.");
    currentDraftType = "none";
    currentDraftPrompt = "";
    clearPalette();
    hideDraftTools();
    return;
  }

  const cells = document.querySelectorAll(".pixel-cell");

  draftData.colors.forEach((color, index) => {
    const cell = cells[index];

    if (!cell) {
      return;
    }

    cell.dataset.referenceColor = color || "";
    renderCellDisplay(cell);
  });

  extractedPaletteColors = Array.isArray(artwork.draft_palette)
    ? artwork.draft_palette.filter(Boolean)
    : extractMainColors(draftData.colors.filter(color => color && color.toLowerCase() !== "#ffffff"), 96);

  currentPalettePage = 1;
  currentDraftType = artwork.draft_type || draftData.type || "unknown";
  currentDraftPrompt = artwork.draft_prompt || draftData.prompt || "";
  draftDepthSlider.value = String(artwork.draft_depth ?? DEFAULT_DRAFT_DEPTH);

  if (extractedPaletteColors.length > 0) {
    renderImagePalettePage();
  } else {
    clearPalette();
  }

  showDraftTools();
  updateDraftDepthLabel();
  renderAllCellDisplays();
}

function hasUserDrawing() {
  const cells = document.querySelectorAll(".pixel-cell");

  return Array.from(cells).some(cell => {
    return cell.dataset.hasUserPaint === "true";
  });
}

function pixelDataToImage(pixelData) {
  if (!pixelData || !pixelData.size || !Array.isArray(pixelData.colors)) {
    return "";
  }

  const size = Number(pixelData.size);
  if (![16, 32, 64].includes(size) || pixelData.colors.length !== size * size) {
    return "";
  }
  const scale = 12;

  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = size * scale;
  previewCanvas.height = size * scale;

  const ctx = previewCanvas.getContext("2d");

  pixelData.colors.forEach((color, index) => {
    const x = index % size;
    const y = Math.floor(index / size);

    ctx.fillStyle = color || "#ffffff";
    ctx.fillRect(x * scale, y * scale, scale, scale);
  });

  return previewCanvas.toDataURL("image/png");
}

function dataURLToBlob(dataURL) {
  const parts = dataURL.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(parts[1]);
  const array = [];

  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }

  return new Blob([new Uint8Array(array)], { type: mime });
}

// 作品圖片僅允許存放在當前作者的單層資料夾：<user-id>/<filename>.png。
// 這是前端的提前防呆；真正的授權仍由 Supabase Storage RLS 控制。
function isArtworkPathOwnedBy(path, userId) {
  if (typeof path !== "string" || typeof userId !== "string") return false;
  const prefix = `${userId}/`;
  if (!path.startsWith(prefix)) return false;
  const filename = path.slice(prefix.length);
  return /^[a-zA-Z0-9_-]+\.png$/.test(filename);
}

async function uploadArtworkImage(pixelData) {
  if (!currentUser?.id) {
    throw new Error("請先登入後再上傳作品圖片。");
  }

  const imageDataUrl = pixelDataToImage(pixelData);
  if (!imageDataUrl) {
    throw new Error("作品像素資料無效，無法產生 PNG 圖片。");
  }
  const blob = dataURLToBlob(imageDataUrl);
  // PNG 通常遠小於此限制；同時也需在 Supabase Bucket 設定 5 MB 上限。
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error("作品圖片超過 5 MB，請調整後再儲存。");
  }

  // 每次儲存都採用新的檔名，避免 CDN / 瀏覽器繼續顯示舊圖片。
  // 同時也能在資料庫更新失敗時保留原有 Storage 圖片。
  const path = `${currentUser.id}/${crypto.randomUUID()}.png`;

  if (!isArtworkPathOwnedBy(path, currentUser.id)) {
    throw new Error("作品圖片儲存路徑不屬於目前帳號，已阻止寫入。");
  }

  const { error } = await supabaseClient.storage
    .from("artworks")
    .upload(path, blob, {
      contentType: "image/png",
      // 永遠不覆寫既有圖片，建立新路徑完成原子式切換。
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data } = supabaseClient.storage
    .from("artworks")
    .getPublicUrl(path);

  return {
    imagePath: path,
    imageUrl: data.publicUrl
  };
}

/* =========================
   Save / Update
========================= */

async function callAIReview(artworkId) {
  try {
    const reviewPromise = supabaseClient.functions.invoke("review-artwork", {
      body: {
        artworkId
      }
    });

    const { error } = await withTimeout(
      reviewPromise,
      30000,
      "AI 審核逾時。作品已儲存，但審核可能尚未完成。"
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn("AI review function error:", error.message);
    alert("作品已存入資料庫，但 AI 審核呼叫失敗。請檢查 review-artwork Edge Function。");
  }
}

async function saveCurrentArtwork() {
  if (!currentUser) {
    if (!confirm("將以 anonymous 匿名身分儲存作品。匿名作品只能在此瀏覽器的工作階段內繼續管理；若登出或清除瀏覽資料，可能無法再取回編輯權限。確定繼續？")) return;
    try {
      await ensureAnonymousAccount();
    } catch (error) {
      alert(`匿名作品儲存準備失敗：${error.message}`);
      return;
    }
  }

  if (editingArtworkId) {
    await updateExistingArtwork();
    return;
  }

  await createNewArtwork();
}

async function createNewArtwork() {
  const inputValidation = validateArtworkInputs(artTitle.value, artStory.value);

  if (!inputValidation.ok) {
    alert(inputValidation.message);
    return;
  }

  if (!hasUserDrawing()) {
    alert("請至少手動畫上一格後再儲存。");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const pixelData = getPixelData();
    const uploaded = await uploadArtworkImage(pixelData);
    const wantsPublic = publishCheckbox.checked;

    const { data, error } = await supabaseClient
      .from("artworks")
      .insert({
         user_id: currentUser.id,
         title: inputValidation.title,
         story: inputValidation.story || "尚未新增作品說明。",
         canvas_size: pixelData.size,
         pixel_data: pixelData,
         image_path: uploaded.imagePath,
         image_url: uploaded.imageUrl,
         is_public: false,
         review_status: wantsPublic ? "reviewing" : "private",
         lifecycle_status: "active",
         ai_generated: currentArtworkIsAIGenerated,
         draft_data: getCurrentDraftData(),
         draft_palette: extractedPaletteColors,
         draft_depth: Number(draftDepthSlider.value || DEFAULT_DRAFT_DEPTH),
         draft_type: currentDraftType,
         draft_prompt: currentDraftPrompt
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (wantsPublic && !isAnonymousUser()) {
      await callAIReview(data.id);
    }

    resetCreateArea();
    currentGalleryMode = "my";
    updateGalleryTabs();
    await renderGallery();

    if (isAdmin) {
      await renderAdminPage();
    }

    showPage("gallery");

    alert(isAnonymousUser()
      ? "匿名作品已儲存。若申請公開，將先由管理者人工審核；匿名工作階段遺失後無法恢復編輯權限。"
      : "作品已成功儲存到 Supabase。若有勾選公開，會先經過 AI 審核。");
  } catch (error) {
    alert(`儲存失敗：${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Artwork";
  }
}

async function updateExistingArtwork() {
  const inputValidation = validateArtworkInputs(artTitle.value, artStory.value);

  if (!inputValidation.ok) {
    alert(inputValidation.message);
    return;
  }

  if (!hasUserDrawing()) {
    alert("作品不能是空白。");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Updating...";

  // 使用新的 Storage 檔案名稱，讓 Gallery 不會因圖片網址快取而顯示舊畫面。
  // 成功更新資料庫後才移除舊檔；如果資料庫更新失敗，保留舊圖片。
  const artworkIdBeingEdited = editingArtworkId;
  const previousImagePath = editingArtworkImagePath;
  let newImagePath = null;
  let databaseUpdated = false;

  try {
    const pixelData = getPixelData();
    const uploaded = await uploadArtworkImage(pixelData);
    newImagePath = uploaded.imagePath;
    const wantsPublic = publishCheckbox.checked;

    const { data, error } = await supabaseClient
      .from("artworks")
      .update({
        title: inputValidation.title,
        story: inputValidation.story || "尚未新增作品說明。",
        canvas_size: pixelData.size,
        pixel_data: pixelData,
        image_path: uploaded.imagePath,
        image_url: uploaded.imageUrl,
        is_public: false,
        review_status: wantsPublic ? "reviewing" : "private",
        lifecycle_status: "active",
        ai_generated: currentArtworkIsAIGenerated,
        draft_data: getCurrentDraftData(),
        draft_palette: extractedPaletteColors,
        draft_depth: Number(draftDepthSlider.value || DEFAULT_DRAFT_DEPTH),
        draft_type: currentDraftType,
        draft_prompt: currentDraftPrompt
      })
      .eq("id", artworkIdBeingEdited)
      .eq("user_id", currentUser.id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    databaseUpdated = true;

    // DB 已指向新路徑後才能刪除舊檔。失敗不影響已成功的編輯操作。
    if (previousImagePath && previousImagePath !== uploaded.imagePath) {
      if (isArtworkPathOwnedBy(previousImagePath, currentUser.id)) {
        const { error: cleanupError } = await supabaseClient.storage
          .from("artworks")
          .remove([previousImagePath]);
        if (cleanupError) {
          console.warn("Old artwork image cleanup failed:", cleanupError.message);
        }
      } else {
        console.warn("Skipped cleanup of an untrusted prior artwork image path.");
      }
    }

    if (wantsPublic && !isAnonymousUser()) {
      await callAIReview(data.id);
    }

    resetCreateArea();
    currentGalleryMode = "my";
    updateGalleryTabs();
    await renderGallery();

    if (isAdmin) {
      await renderAdminPage();
    }

    showPage("gallery");

    alert("作品已更新，Gallery 將顯示新的圖片。若有勾選公開，會重新送 AI 審核。");
  } catch (error) {
    if (!databaseUpdated && newImagePath) {
      // 只有在確認資料庫沒有使用新路徑時，才清除剛上傳的暫存圖片。
      // 若查詢失敗，寧願留下待清理檔案，也不能誤刪作品正式圖片。
      try {
        const { data: persisted, error: readError } = await supabaseClient
          .from("artworks")
          .select("image_path")
          .eq("id", artworkIdBeingEdited)
          .eq("user_id", currentUser.id)
          .maybeSingle();
        if (!readError && persisted?.image_path !== newImagePath) {
          const { error: cleanupError } = await supabaseClient.storage
            .from("artworks")
            .remove([newImagePath]);
          if (cleanupError) {
            console.warn("New artwork image cleanup failed:", cleanupError.message);
          }
        }
      } catch (cleanupError) {
        console.warn("Image cleanup verification failed:", cleanupError.message);
      }
    }
    alert(`更新失敗：${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Artwork";
  }
}

saveBtn.addEventListener("click", saveCurrentArtwork);

async function editArtworkById(id) {
  if (!currentUser) {
    alert("請先登入後再編輯作品。");
    return;
  }

  const { data, error } = await supabaseClient
    .from("artworks")
    .select("*")
    .eq("id", id)
    .eq("user_id", currentUser.id)
    .single();

  if (error) {
    alert(`讀取作品失敗：${error.message}`);
    return;
  }

  editingArtworkId = data.id;
  editingArtworkImagePath = data.image_path;
  currentArtworkIsAIGenerated = Boolean(data.ai_generated);

  loadPixelDataToCanvas(data.pixel_data);
  applySavedDraftToCanvas(data);

  artTitle.value = data.title || "";
  artStory.value = data.story || "";
  publishCheckbox.checked = data.is_public && data.review_status === "approved";

  imageUpload.value = "";
  aiPromptInput.value = "";
  aiDraftStatus.textContent = "";
  aiDraftStatus.className = "ai-draft-status";

  if (!data.draft_data) {
    clearPalette();
    hideDraftTools();
  }

  undoStack = [];
  redoStack = [];
  updateHistoryButtons();

  saveBtn.textContent = "Update Artwork";
  editModeNotice.classList.remove("hidden-panel");

  setTool("brush");
  showPage("create");
}

function resetCreateArea() {
  editingArtworkId = null;
  editingArtworkImagePath = null;
  currentArtworkIsAIGenerated = false;
  currentDraftType = "none";
  currentDraftPrompt = "";

  createCanvas(Number(sizeSelect.value));

  artTitle.value = "";
  artStory.value = "";
  publishCheckbox.checked = true;
  imageUpload.value = "";
  aiPromptInput.value = "";
  aiDraftStatus.textContent = "";
  aiDraftStatus.className = "ai-draft-status";

  clearPalette();
  hideDraftTools();

  setTool("brush");

  undoStack = [];
  redoStack = [];

  saveBtn.textContent = "Save Artwork";
  editModeNotice.classList.add("hidden-panel");

  updateHistoryButtons();
}


/* =========================
   Gallery Render
========================= */

function getReviewInfo(artwork) {
  if (artwork.review_status === "reviewing") {
    return { label: "AI Reviewing", className: "status-reviewing" };
  }

  if (artwork.review_status === "approved") {
    return { label: "Approved", className: "status-approved" };
  }

  if (artwork.review_status === "pending") {
    return { label: "Pending Review", className: "status-pending" };
  }

  if (artwork.review_status === "rejected") {
    return { label: "Rejected", className: "status-rejected" };
  }

  return { label: "Private", className: "status-private" };
}

function renderReviewStatus(artwork) {
  const info = getReviewInfo(artwork);

  return `
    <span class="review-status ${escapeAttr(info.className)}">
      ${escapeHTML(info.label)}
    </span>
  `;
}

function getLifecycleInfo(artwork) {
  const status = artwork.lifecycle_status || "active";

  if (status === "featured") {
    return { label: "Lifecycle: Featured", className: "lifecycle-featured" };
  }

  if (status === "low_activity") {
    return { label: "Lifecycle: Low Activity", className: "lifecycle-low" };
  }

  if (status === "pending_delete") {
    return { label: "Lifecycle: Pending Delete", className: "lifecycle-pending" };
  }

  if (status === "hidden") {
    return { label: "Lifecycle: Hidden", className: "lifecycle-hidden" };
  }

  if (status === "archived") {
    return { label: "Lifecycle: Archived", className: "lifecycle-archived" };
  }

  return { label: "Lifecycle: Active", className: "lifecycle-active" };
}

function renderLifecycleStatus(artwork) {
  const info = getLifecycleInfo(artwork);

  return `
    <span class="lifecycle-badge ${escapeAttr(info.className)}">
      ${escapeHTML(info.label)}
    </span>
  `;
}

function renderFeaturedRibbon(artwork) {
  if (!artwork.featured) {
    return "";
  }

  return `<div class="featured-ribbon">Featured</div>`;
}

async function getTopCommentsMap(artworkIds) {
  if (!artworkIds.length) {
    return {};
  }

  const { data, error } = await supabaseClient
    .from("comments")
    .select("artwork_id, comment")
    .in("artwork_id", artworkIds);

  if (error) {
    return {};
  }

  const map = {};

  data.forEach(row => {
    if (!map[row.artwork_id]) {
      map[row.artwork_id] = {};
    }

    const safeComment = normalizeForSecurity(row.comment);
    map[row.artwork_id][safeComment] = (map[row.artwork_id][safeComment] || 0) + 1;
  });

  return map;
}

async function getLikedArtworkIds(artworkIds) {
  if (!currentUser || !artworkIds.length) {
    return new Set();
  }

  const { data, error } = await supabaseClient
    .from("likes")
    .select("artwork_id")
    .eq("user_id", currentUser.id)
    .in("artwork_id", artworkIds);

  if (error) {
    console.warn("Get liked artworks error:", error.message);
    return new Set();
  }

  return new Set((data || []).map(row => row.artwork_id));
}

function getTopCommentsFromMap(commentMapForArtwork, limit = 3) {
  if (!commentMapForArtwork) {
    return [];
  }

  return Object.entries(commentMapForArtwork)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([text, count]) => ({ text, count }));
}

function renderFloatingCommentBubbles(artwork, commentsMap) {
  const topComments = getTopCommentsFromMap(commentsMap[artwork.id], 3);

  if (topComments.length === 0) {
    return "";
  }

  return `
    <div class="floating-comments">
      ${topComments.map((comment, index) => {
        return `
          <div class="comment-bubble bubble-${index + 1}">
            ${escapeHTML(comment.text)}<strong>×${escapeHTML(comment.count)}</strong>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderCommentSummary(artwork, commentsMap) {
  const topComments = getTopCommentsFromMap(commentsMap[artwork.id], 6);

  if (topComments.length === 0) {
    return `
      <div class="comment-summary-area">
        <h4>留言統計</h4>
        <p class="art-meta">目前尚無留言</p>
      </div>
    `;
  }

  return `
    <div class="comment-summary-area">
      <h4>留言統計</h4>
      <div class="comment-summary-list">
        ${topComments.map(comment => {
          return `
            <span class="comment-pill">
              ${escapeHTML(comment.text)}<strong>×${escapeHTML(comment.count)}</strong>
            </span>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderQuickCommentButtons(artworkId) {
  return quickCommentOptions.map(comment => {
    return `
      <button class="quick-comment-btn" data-id="${escapeAttr(artworkId)}" data-comment="${escapeAttr(comment)}" type="button">
        ${escapeHTML(comment)}
      </button>
    `;
  }).join("");
}

const reportReasonOptions = [
  "不當文字或圖像",
  "攻擊或辱罵內容",
  "色情或裸露暗示",
  "暴力、自傷或危險內容",
  "仇恨或歧視內容",
  "其他"
];

function buildReportReasonMessage() {
  return reportReasonOptions
    .map((reason, index) => `${index + 1}. ${reason}`)
    .join("\n");
}

function renderAIGeneratedBadge(artwork) {
  if (!artwork.ai_generated) {
    return "";
  }

  return `
    <div class="story-badge-row">
      <span class="story-badge ai-badge">
        <span class="ai-badge-label">AI Generated</span>
      </span>
    </div>
  `;
}

async function getVisibleArtworks() {
  if (currentGalleryMode === "public") {
    let query = supabaseClient
      .from("public_gallery")
      .select("*");

    if (currentPublicFilter === "featured") {
      query = query.eq("featured", true).order("likes_count", { ascending: false });
    } else if (currentPublicFilter === "newest") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query
        .order("featured", { ascending: false })
        .order("likes_count", { ascending: false })
        .order("comments_count", { ascending: false })
        .order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      alert(`讀取 Public Gallery 失敗：${error.message}`);
      return [];
    }

    return data || [];
  }

  if (!currentUser) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("artworks")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    alert(`讀取 My Works 失敗：${error.message}`);
    return [];
  }

  return data || [];
}

async function renderGallery() {
  const artworks = await getVisibleArtworks();
  const artworkIds = artworks.map(artwork => artwork.id);
  const commentsMap = await getTopCommentsMap(artworkIds);
  const likedArtworkIds = await getLikedArtworkIds(artworkIds);

  galleryGrid.innerHTML = "";

  if (artworks.length === 0) {
    const message =
      currentGalleryMode === "public"
        ? "目前尚無公開作品，或作品正在 AI 審核中。"
        : "目前尚無個人作品。開始創作第一個像素回憶吧。";

    galleryGrid.innerHTML = `
      <div class="empty-gallery">
        ${escapeHTML(message)}
      </div>
    `;
    return;
  }

  artworks.forEach(artwork => {
    const card = document.createElement("div");
    card.classList.add("art-card");

    const imageUrl = safeArtworkImageSource(artwork);
    const safeImageUrl = escapeAttr(imageUrl);
    const badgeText = artwork.is_public ? "Public" : "Private";
    const badgeClass = artwork.is_public ? "public-badge" : "private-badge";
    const authorName = artwork.display_name || getDisplayNameFromUser(currentUser);
    const createdText = artwork.created_at ? new Date(artwork.created_at).toLocaleString() : "";
    const isLikedByCurrentUser = likedArtworkIds.has(artwork.id);
    const isOwnArtwork = Boolean(currentUser && artwork.user_id === currentUser.id);
    const likeButtonClass = isLikedByCurrentUser ? "like-btn like-art-btn liked-like-btn" : "like-btn like-art-btn";
    const likeButtonLabel = isOwnArtwork ? "自己的作品" : isLikedByCurrentUser ? "♥ Liked" : "♡ Like";
    const likeButtonDisabled = isOwnArtwork ? "disabled" : "";
    const publicBackActions = `
      <div class="card-actions">
        <button class="card-btn detail-btn detail-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          查看詳情
        </button>
        <button class="card-btn report-btn report-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          檢舉作品
        </button>
      </div>

      <button class="${likeButtonClass}" data-id="${escapeAttr(artwork.id)}" type="button" ${likeButtonDisabled}>
        ${escapeHTML(likeButtonLabel)}
      </button>

      <div class="quick-comment-area">
        <h4>快捷留言</h4>
        <div class="quick-comment-buttons">
          ${renderQuickCommentButtons(artwork.id)}
        </div>
      </div>
    `;

    const myWorksBackActions = `
      <div class="card-actions">
        <button class="card-btn detail-btn detail-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          查看詳情
        </button>
        <button class="card-btn edit-btn edit-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          編輯作品
        </button>
        <button class="card-btn download-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          下載作品
        </button>
        <button class="card-btn publish-btn toggle-public-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          ${artwork.is_public && artwork.review_status === "approved" ? "取消公開" : "送出公開審核"}
        </button>
        <button class="card-btn delete-btn delete-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          刪除作品
        </button>
      </div>
    `;

    card.innerHTML = `
      <div class="art-card-inner">
        <div class="art-card-front">
          ${renderFeaturedRibbon(artwork)}
          ${renderFloatingCommentBubbles(artwork, commentsMap)}

          ${
            imageUrl
              ? `<img src="${safeImageUrl}" class="art-preview" alt="${escapeAttr(artwork.title || "Artwork")}">`
              : `<div class="no-image">No image data</div>`
          }

          <h3>${escapeHTML(artwork.title || "Untitled Artwork")}</h3>
          <p class="art-meta">${escapeHTML(authorName)} · ${escapeHTML(createdText)}</p>
          <span class="status-badge ${escapeAttr(badgeClass)}">${escapeHTML(badgeText)}</span>
          ${renderReviewStatus(artwork)}
          <p class="like-row">♡ ${escapeHTML(artwork.likes_count || 0)} likes</p>
          <p class="flip-hint">點擊查看作品背面故事</p>
        </div>

        <div class="art-card-back">
          <h3>${escapeHTML(artwork.title || "Untitled Artwork")}</h3>
          <p>${escapeHTML(artwork.story || "尚未新增作品說明。")}</p>
          <p class="like-row">♡ ${escapeHTML(artwork.likes_count || 0)} likes</p>
          ${renderReviewStatus(artwork)}
          ${renderAIGeneratedBadge(artwork)}

          ${renderCommentSummary(artwork, commentsMap)}

          ${
            currentGalleryMode === "public"
              ? publicBackActions
              : myWorksBackActions
          }
        </div>
      </div>
    `;

    galleryGrid.appendChild(card);
  });
}

/* =========================
   Interactions
========================= */

async function likeArtworkById(id) {
  if (!currentUser) {
    alert("請先登入後再按 Like。");
    return;
  }

  const artwork = await fetchArtworkById(id);

  if (!artwork) {
    return;
  }

  if (artwork.user_id === currentUser.id) {
    alert("不能 Like 自己的作品。");
    return;
  }

  const { error } = await supabaseClient
    .from("likes")
    .insert({
      artwork_id: id,
      user_id: currentUser.id
    });

  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      alert("你已經 Like 過這件作品。");
    } else {
      alert(`Like 失敗：${error.message}`);
    }
    return;
  }

  await renderGallery();

  if (isAdmin) {
    await renderAdminPage();
  }
}

async function reportArtworkById(id) {
  if (!currentUser) {
    alert("請先登入後再檢舉作品。");
    return;
  }

  const input = prompt(
    `請輸入檢舉原因編號，或直接輸入補充說明：\n${buildReportReasonMessage()}`
  );

  if (input === null) {
    return;
  }

  const trimmedInput = normalizeForSecurity(input);

  if (!trimmedInput) {
    alert("請輸入檢舉原因。");
    return;
  }

  let reason = trimmedInput;
  const reasonIndex = Number(trimmedInput);

  if (Number.isInteger(reasonIndex) && reasonIndex >= 1 && reasonIndex <= reportReasonOptions.length) {
    reason = reportReasonOptions[reasonIndex - 1];
  }

  const reasonValidation = validatePlainTextField(reason, "檢舉原因", 120, { required: true });

  if (!reasonValidation.ok) {
    alert(reasonValidation.message);
    return;
  }

  try {
    const { error } = await supabaseClient.rpc("submit_artwork_report", {
      p_artwork_id: id,
      p_reason: reasonValidation.value
    });

    if (error) {
      throw error;
    }

    alert("檢舉已送出，管理者將人工審查。檢舉不會自動將他人的作品下架。");
    await renderGallery();

    if (isAdmin) {
      await renderAdminPage();
    }
  } catch (error) {
    console.error("Report artwork error:", error);
    alert(`檢舉失敗：${error.message || "Unknown error"}`);
  }
}

async function commentArtworkById(id, comment) {
  if (!currentUser) {
    alert("請先登入後再留言。");
    return;
  }

  const commentValidation = validatePlainTextField(comment, "留言", SECURITY_LIMITS.comment, { required: true });

  if (!commentValidation.ok) {
    alert(commentValidation.message);
    return;
  }

  const { error } = await supabaseClient
    .from("comments")
    .insert({
      artwork_id: id,
      user_id: currentUser.id,
      comment: commentValidation.value
    });

  if (error) {
    alert(`留言失敗：${error.message}`);
    return;
  }

  await renderGallery();

  if (isAdmin) {
    await renderAdminPage();
  }
}

async function togglePublicById(id) {
  if (!currentUser) {
    alert("請先登入。");
    return;
  }

  const artwork = await fetchArtworkById(id);

  if (!artwork) {
    return;
  }

  if (artwork.is_public && artwork.review_status === "approved") {
    const { error } = await supabaseClient
      .from("artworks")
      .update({
        is_public: false,
        review_status: "private"
      })
      .eq("id", id)
      .eq("user_id", currentUser.id);

    if (error) {
      alert(`取消公開失敗：${error.message}`);
      return;
    }

    await renderGallery();

    if (isAdmin) {
      await renderAdminPage();
    }

    return;
  }

  const { error } = await supabaseClient
    .from("artworks")
    .update({
      is_public: false,
      review_status: "reviewing",
      lifecycle_status: "active"
    })
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert(`送審失敗：${error.message}`);
    return;
  }

  if (!isAnonymousUser()) await callAIReview(id);
  await renderGallery();

  if (isAdmin) {
    await renderAdminPage();
  }
}

async function deleteArtworkById(id) {
  if (!currentUser) {
    alert("請先登入。");
    return;
  }

  const confirmDelete = confirm("確定要刪除這件作品嗎？刪除後無法復原。");
  if (!confirmDelete) return;

  const artwork = await fetchArtworkById(id);
  if (!artwork) return;
  if (artwork.user_id !== currentUser.id) {
    alert("你只能刪除自己的作品。");
    return;
  }

  // 先確認資料庫確實刪除，避免 Storage 先被清掉、資料庫卻刪除失敗。
  const { data: deleted, error } = await supabaseClient
    .from("artworks")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id)
    .select("id");

  if (error || !deleted?.length) {
    alert(`刪除失敗：${error?.message || "無法刪除這件作品，請檢查權限。"}`);
    return;
  }

  // 只有明確屬於自己的圖片路徑才要求刪除，真正權限仍由 Storage RLS 控制。
  if (artwork.image_path && isArtworkPathOwnedBy(artwork.image_path, currentUser.id)) {
    const { error: storageError } = await supabaseClient.storage
      .from("artworks")
      .remove([artwork.image_path]);
    if (storageError) {
      console.warn("Artwork image cleanup failed:", storageError.message);
      alert("作品資料已刪除，但圖片清理失敗；請聯絡管理員檢查 Storage 殘留檔案。");
    }
  }

  await renderGallery();
  if (isAdmin) await renderAdminPage();
}

/* =========================
   Download preview / perler-bead grid / mobile backup
========================= */
let pendingDownloadPixelData = null;
let pendingDownloadTitle = "pixalbum_artwork";
let downloadReturnPage = "create";
const downloadPreviewImage = document.getElementById("downloadPreviewImage");
const downloadGridCheckbox = document.getElementById("downloadGridCheckbox");
const downloadStatus = document.getElementById("downloadStatus");

function buildDownloadPNG(pixelData, withGrid) {
  const size = Number(pixelData?.size);
  if (![16,32,64].includes(size) || !Array.isArray(pixelData?.colors) || pixelData.colors.length !== size*size) {
    throw new Error("像素資料不完整，無法產生下載圖檔。");
  }
  const unit = 16;
  const out = document.createElement("canvas");
  out.width = out.height = size * unit;
  const ctx = out.getContext("2d", { alpha:false });
  if (!ctx) throw new Error("瀏覽器不支援繪製 PNG。");
  pixelData.colors.forEach((color, i) => {
    ctx.fillStyle = /^#[0-9a-fA-F]{6}$/.test(color || "") ? color : "#ffffff";
    ctx.fillRect((i % size)*unit, Math.floor(i / size)*unit, unit, unit);
  });
  if (withGrid) {
    ctx.strokeStyle = "#e0e3e5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= size; i++) {
      const point = (i*unit) + (i === size ? -0.5 : 0.5);
      ctx.moveTo(point,0); ctx.lineTo(point,size*unit);
      ctx.moveTo(0,point); ctx.lineTo(size*unit,point);
    }
    ctx.stroke();
  }
  return out.toDataURL("image/png");
}
function refreshDownloadPreview() {
  if (!pendingDownloadPixelData) return;
  try {
    downloadPreviewImage.src = buildDownloadPNG(pendingDownloadPixelData, downloadGridCheckbox.checked);
    downloadStatus.textContent = "可下載 PNG；手機也可以使用『開啟圖片』後長按儲存。";
  } catch (error) {
    downloadStatus.textContent = error.message;
  }
}
function showDownloadPage(pixelData, title, backPage) {
  pendingDownloadPixelData = pixelData;
  pendingDownloadTitle = title || "pixalbum_artwork";
  downloadReturnPage = backPage || "create";
  document.getElementById("downloadArtworkName").textContent = pendingDownloadTitle;
  downloadGridCheckbox.checked = true;
  refreshDownloadPreview();
  showPage("download");
}
async function downloadArtworkById(id) {
  const artwork = await fetchArtworkById(id);
  if (!artwork) return;
  if (!artwork.pixel_data?.colors) { alert("無法讀取作品像素資料。"); return; }
  showDownloadPage(artwork.pixel_data, artwork.title, "gallery");
}
function downloadCurrentArtwork() {
  if (!hasUserDrawing()) { alert("請先手動填色或繪製一格後再下載。"); return; }
  showDownloadPage(getPixelData(), artTitle.value.trim() || "pixalbum_artwork", "create");
}
function triggerPNGDownload() {
  if (!pendingDownloadPixelData) return;
  const dataUrl = buildDownloadPNG(pendingDownloadPixelData, downloadGridCheckbox.checked);
  const name = sanitizeFileName(pendingDownloadTitle) + (downloadGridCheckbox.checked ? "_grid" : "") + ".png";
  // 此操作由真正的使用者點擊直接觸發，避免手機阻擋間接下載。
  const blob = dataURLToBlob(dataUrl);
  if (navigator.canShare && navigator.share) {
    const file = new File([blob], name, {type:"image/png"});
    if (navigator.canShare({ files:[file] })) {
      navigator.share({ files:[file], title:pendingDownloadTitle }).then(() => {
        downloadStatus.textContent = "已開啟手機分享／儲存選單。";
      }).catch(error => {
        if (error.name !== "AbortError") downloadStatus.textContent = "分享失敗，可按『開啟圖片』長按儲存。";
      });
      return;
    }
  }
  const link = document.createElement("a");
  link.download = name;
  link.href = dataUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  downloadStatus.textContent = "已送出 PNG 下載要求。若手機沒有儲存，請點『開啟圖片／手機長按儲存』。";
}
downloadGridCheckbox?.addEventListener("change",refreshDownloadPreview);
document.getElementById("downloadConfirmBtn")?.addEventListener("click", triggerPNGDownload);
document.getElementById("downloadOpenImageBtn")?.addEventListener("click", () => {
  if (!pendingDownloadPixelData) return;
  // user gesture directly opens new tab; phone can long-press image to save.
  const url = buildDownloadPNG(pendingDownloadPixelData, downloadGridCheckbox.checked);
  const opened = window.open(url,"_blank","noopener,noreferrer");
  if (!opened) downloadStatus.textContent = "瀏覽器封鎖新分頁，請允許 Pixalbum 開啟彈出視窗。";
});
document.getElementById("downloadBackBtn")?.addEventListener("click", () => showPage(downloadReturnPage));
downloadBtn.addEventListener("click", downloadCurrentArtwork);

/* =========================
   Admin Review
========================= */

function isReviewQueueArtwork(artwork) {
  return (
    artwork.review_status === "reviewing" ||
    artwork.review_status === "pending" ||
    artwork.review_status === "rejected" ||
    Number(artwork.report_count || 0) > 0
  );
}

function isPublicManagementArtwork(artwork) {
  return artwork.review_status === "approved" && artwork.is_public === true;
}

function getAdminCardClass(artwork) {
  if (artwork.review_status === "approved") {
    return "admin-card-approved";
  }

  if (artwork.review_status === "rejected") {
    return "admin-card-danger";
  }

  if (artwork.review_status === "pending") {
    return "admin-card-warning";
  }

  return "";
}

function getAdminReviewChipClass(artwork) {
  if (artwork.review_status === "approved") return "admin-chip-approved";
  if (artwork.review_status === "reviewing") return "admin-chip-reviewing";
  if (artwork.review_status === "pending") return "admin-chip-pending";
  if (artwork.review_status === "rejected") return "admin-chip-rejected";
  return "admin-chip-private";
}

function getAdminLifecycleChipClass(artwork) {
  if (artwork.lifecycle_status === "hidden") return "admin-chip-hidden";
  if (artwork.lifecycle_status === "pending_delete") return "admin-chip-rejected";
  if (artwork.lifecycle_status === "low_activity") return "admin-chip-pending";
  if (artwork.lifecycle_status === "featured") return "admin-chip-approved";
  return "admin-chip-private";
}

function safeText(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function truncateText(text, maxLength = 120) {
  const finalText = safeText(text);

  if (finalText.length <= maxLength) {
    return finalText;
  }

  return `${finalText.slice(0, maxLength)}...`;
}

function renderAdminCard(artwork, mode = "queue") {
  const imageUrl = safeArtworkImageSource(artwork);
  const createdText = artwork.created_at ? new Date(artwork.created_at).toLocaleString() : "—";
  const ownerName = artwork.display_name || "匿名使用者";
  const reviewLabel = artwork.review_status || "private";
  const visibilityLabel = artwork.is_public ? "Public" : "Private";
  const visibilityClass = artwork.is_public ? "admin-chip-public" : "admin-chip-private";
  let actions = "";

  if (mode === "queue") {
    actions = `
      <button class="admin-action-btn admin-approve-btn" data-admin-action="approve" data-id="${escapeAttr(artwork.id)}" type="button">
        Approve
      </button>
      <button class="admin-action-btn admin-reject-btn" data-admin-action="reject" data-id="${escapeAttr(artwork.id)}" type="button">
        Reject
      </button>
      <button class="admin-action-btn admin-delete-btn" data-admin-action="delete" data-id="${escapeAttr(artwork.id)}" type="button">
        Delete
      </button>
    `;
  } else if (mode === "public") {
    actions = `
      <button class="admin-action-btn admin-hide-btn" data-admin-action="hide" data-id="${escapeAttr(artwork.id)}" type="button">
        Hide
      </button>
      <button class="admin-action-btn admin-delete-btn" data-admin-action="delete" data-id="${escapeAttr(artwork.id)}" type="button">
        Delete
      </button>
    `;
  } else {
    actions = `
      <button class="admin-action-btn admin-approve-btn" data-admin-action="approve" data-id="${escapeAttr(artwork.id)}" type="button">
        Approve
      </button>
      <button class="admin-action-btn admin-reject-btn" data-admin-action="reject" data-id="${escapeAttr(artwork.id)}" type="button">
        Reject
      </button>
      <button class="admin-action-btn admin-hide-btn" data-admin-action="hide" data-id="${escapeAttr(artwork.id)}" type="button">
        Hide
      </button>
      <button class="admin-action-btn admin-delete-btn" data-admin-action="delete" data-id="${escapeAttr(artwork.id)}" type="button">
        Delete
      </button>
    `;
  }

  return `
    <div class="admin-card ${escapeAttr(getAdminCardClass(artwork))}">
      ${
        imageUrl
          ? `<img class="admin-card-image" src="${escapeAttr(imageUrl)}" alt="${escapeAttr(artwork.title || "Artwork")}">`
          : `<div class="no-image">No image</div>`
      }

      <h4 class="admin-card-title">${escapeHTML(safeText(artwork.title))}</h4>
      <p class="admin-card-meta">${escapeHTML(ownerName)} · ${escapeHTML(createdText)}</p>

      <div class="admin-status-row">
        <span class="admin-status-chip ${escapeAttr(visibilityClass)}">${escapeHTML(visibilityLabel)}</span>
        <span class="admin-status-chip ${escapeAttr(getAdminReviewChipClass(artwork))}">${escapeHTML(reviewLabel)}</span>
      </div>

      <div class="admin-card-story">
        ${escapeHTML(truncateText(artwork.story || "尚未新增作品說明。", 140))}
      </div>

      <div class="admin-stats">
        <span>♡ ${escapeHTML(artwork.likes_count || 0)}</span>
        <span>💬 ${escapeHTML(artwork.comments_count || 0)}</span>
      </div>

      ${Number(artwork.report_count || 0) > 0 ? `
        <div class="admin-report-alert">
          <strong>待處理檢舉：${Number(artwork.report_count)} 則</strong>
          <ul>${(artwork.report_reasons || []).map(reason => `<li>${escapeHTML(reason)}</li>`).join("")}</ul>
        </div>
      ` : ""}

      <div class="admin-actions">
        <button class="admin-action-btn" data-admin-action="detail" data-id="${escapeAttr(artwork.id)}" type="button">
          Detail
        </button>
        ${actions}
      </div>
    </div>
  `;
}

async function fetchAdminArtworks() {
  if (!isAdmin) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from("admin_review_artworks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert(`讀取 Admin Review 失敗：${error.message}`);
    return [];
  }

  // 檢舉案件只供管理者查詢；不因單一檢舉自動下架作品。
  const { data: openReports, error: reportError } = await supabaseClient
    .from("reports")
    .select("artwork_id, reason, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (reportError) {
    console.warn("Admin reports read error:", reportError.message);
    return data || [];
  }

  const reportMap = new Map();
  (openReports || []).forEach(report => {
    if (!reportMap.has(report.artwork_id)) reportMap.set(report.artwork_id, []);
    reportMap.get(report.artwork_id).push(report.reason || "未填原因");
  });

  return (data || []).map(artwork => {
    const reasons = reportMap.get(artwork.id) || [];
    return { ...artwork, report_count: reasons.length, report_reasons: reasons.slice(0, 3) };
  });
}

function renderAdminGrid(gridElement, artworks, mode, emptyMessage) {
  if (!gridElement) {
    return;
  }

  if (!artworks.length) {
    gridElement.innerHTML = `
      <div class="admin-empty">
        ${escapeHTML(emptyMessage)}
      </div>
    `;
    return;
  }

  gridElement.innerHTML = artworks.map(artwork => {
    return renderAdminCard(artwork, mode);
  }).join("");
}

async function renderAdminPage() {
  if (!isAdmin) {
    return;
  }

  const artworks = await fetchAdminArtworks();

  const reviewQueue = artworks.filter(isReviewQueueArtwork);
  const publicWorks = artworks.filter(isPublicManagementArtwork);

  adminReviewCount.textContent = String(reviewQueue.length);
  adminPublicCount.textContent = String(publicWorks.length);
  adminTotalCount.textContent = String(artworks.length);

  renderAdminGrid(
    adminReviewGrid,
    reviewQueue,
    "queue",
    "目前沒有待審核、可疑或被拒絕的作品。"
  );

  renderAdminGrid(
    adminPublicGrid,
    publicWorks,
    "public",
    "目前沒有已公開作品。"
  );

  renderAdminGrid(
    adminAllGrid,
    artworks,
    "all",
    "目前系統內沒有任何作品。"
  );
}

async function markArtworkReportsReviewed(id) {
  const { error } = await supabaseClient
    .from("reports")
    .update({ status: "reviewed", updated_at: new Date().toISOString() })
    .eq("artwork_id", id)
    .eq("status", "open");
  if (error) {
    console.warn("Could not mark reports reviewed:", error.message);
  }
}

async function adminApproveArtwork(id) {
  if (!isAdmin) {
    alert("你沒有管理者權限。");
    return;
  }

  const { error } = await supabaseClient
    .from("artworks")
    .update({
      review_status: "approved",
      is_public: true,
      lifecycle_status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    alert(`Approve 失敗：${error.message}`);
    return;
  }

  await markArtworkReportsReviewed(id);
  await refreshAdminAndGallery();
}

async function adminRejectArtwork(id) {
  if (!isAdmin) {
    alert("你沒有管理者權限。");
    return;
  }

  const { error } = await supabaseClient
    .from("artworks")
    .update({
      review_status: "rejected",
      is_public: false,
      lifecycle_status: "hidden",
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    alert(`Reject 失敗：${error.message}`);
    return;
  }

  await markArtworkReportsReviewed(id);
  await refreshAdminAndGallery();
}

async function adminHideArtwork(id) {
  if (!isAdmin) {
    alert("你沒有管理者權限。");
    return;
  }

  const { error } = await supabaseClient
    .from("artworks")
    .update({
      is_public: false,
      review_status: "private",
      lifecycle_status: "hidden",
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    alert(`Hide 失敗：${error.message}`);
    return;
  }

  await markArtworkReportsReviewed(id);
  await refreshAdminAndGallery();
}

async function adminDeleteArtwork(id) {
  if (!isAdmin) {
    alert("你沒有管理者權限。");
    return;
  }

  const confirmDelete = confirm("管理者刪除：確定要永久刪除這件作品嗎？這會刪除資料庫作品與 Storage 圖片。");
  if (!confirmDelete) return;

  const artwork = await fetchArtworkById(id);
  if (!artwork) return;

  // 僅以資料庫已確認刪除的作品進行圖片清理，避免資料庫刪除失敗造成破圖。
  const { data: deleted, error } = await supabaseClient
    .from("artworks")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !deleted?.length) {
    alert(`Delete 失敗：${error?.message || "作品不存在或資料庫拒絕刪除。"}`);
    return;
  }

  // 防止惡意作品把 image_path 指向其他人的檔案後，誘使管理者刪除該檔案。
  if (artwork.image_path && isArtworkPathOwnedBy(artwork.image_path, artwork.user_id)) {
    const { error: storageError } = await supabaseClient.storage
      .from("artworks")
      .remove([artwork.image_path]);
    if (storageError) {
      console.warn("Admin storage cleanup failed:", storageError.message);
      alert("作品資料已刪除，但 Storage 圖片清理失敗，請人工檢查殘留檔案。");
    }
  } else if (artwork.image_path) {
    console.warn("Skipped unsafe artwork image path:", artwork.id);
    alert("作品已刪除，但圖片路徑異常，已略過 Storage 刪除以保護其他人的檔案。");
  }

  await refreshAdminAndGallery();
}

async function refreshAdminAndGallery() {
  await renderAdminPage();
  await renderGallery();
}

async function handleAdminAction(event) {
  const button = event.target.closest("button[data-admin-action]");

  if (!button) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const action = button.dataset.adminAction;
  const id = button.dataset.id;

  if (!id) {
    return;
  }

  if (action === "detail") {
    const artwork = await fetchArtworkById(id);

    if (artwork) {
      openArtworkModal(artwork);
    }

    return;
  }

  if (action === "approve") {
    await adminApproveArtwork(id);
    return;
  }

  if (action === "reject") {
    await adminRejectArtwork(id);
    return;
  }

  if (action === "hide") {
    await adminHideArtwork(id);
    return;
  }

  if (action === "delete") {
    await adminDeleteArtwork(id);
  }
}

if (adminReviewGrid) {
  adminReviewGrid.addEventListener("click", handleAdminAction);
}

if (adminPublicGrid) {
  adminPublicGrid.addEventListener("click", handleAdminAction);
}

if (adminAllGrid) {
  adminAllGrid.addEventListener("click", handleAdminAction);
}

if (refreshAdminBtn) {
  refreshAdminBtn.addEventListener("click", async () => {
    if (!isAdmin) {
      alert("你沒有管理者權限。");
      return;
    }

    await renderAdminPage();
    alert("Admin Review 已重新整理。");
  });
}

/* =========================
   Postcards: contact our team
========================= */
const postcardForm = document.getElementById("postcardForm");
const postcardTitle = document.getElementById("postcardTitle");
const postcardCategory = document.getElementById("postcardCategory");
const postcardDetails = document.getElementById("postcardDetails");
const postcardStampSelect = document.getElementById("postcardStampSelect");
const postcardStampPreview = document.getElementById("postcardStampPreview");
const postcardStatus = document.getElementById("postcardStatus");
const postcardSendBtn = document.getElementById("postcardSendBtn");
let availablePostcardStamps = new Map();
const postcardCategoryLabels = {
  bug: "系統錯誤／功能異常", account: "帳號／登入問題",
  artwork: "作品／儲存／下載", ai: "AI 創作問題",
  suggestion: "功能建議", other: "其他"
};

function updatePostcardStampPreview() {
  const selected = availablePostcardStamps.get(postcardStampSelect?.value);
  postcardStampPreview.src = selected ? safeArtworkImageSource(selected) : "annomous.png";
}
async function loadPostcardStamps() {
  if (!postcardStampSelect) return;
  const lastSelected = postcardStampSelect.value;
  postcardStampSelect.replaceChildren(new Option("預設匿名郵票", ""));
  availablePostcardStamps = new Map();
  if (currentUser) {
    const {data,error} = await supabaseClient.from("artworks")
      .select("id,title,pixel_data,image_url")
      .eq("user_id",currentUser.id)
      .order("created_at",{ascending:false}).limit(60);
    if (error) console.warn("Postcard stamp list:",error.message);
    else (data || []).forEach(artwork => {
      availablePostcardStamps.set(artwork.id,artwork);
      postcardStampSelect.add(new Option(artwork.title || "Untitled", artwork.id));
    });
  }
  if (availablePostcardStamps.has(lastSelected)) postcardStampSelect.value = lastSelected;
  updatePostcardStampPreview();
}
postcardStampSelect?.addEventListener("change", updatePostcardStampPreview);

postcardForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const title = validatePlainTextField(postcardTitle.value,"標題",80,{required:true});
  if (!title.ok) { alert(title.message); return; }
  const details = validatePlainTextField(postcardDetails.value,"詳細問題回報",2000,{required:true});
  if (!details.ok) { alert(details.message); return; }
  const category = postcardCategory.value;
  if (!Object.hasOwn(postcardCategoryLabels,category)) { alert("請選擇問題種類。"); return; }
  const stampArtworkId = postcardStampSelect.value || null;
  postcardSendBtn.disabled = true;
  postcardSendBtn.textContent = "Sending...";
  postcardStatus.textContent = "正在寄送明信片…";
  try {
    // 無帳號者自動取得 Supabase Anonymous Auth 工作階段；資料庫 RPC 驗證身分及限流。
    await ensureAnonymousAccount();
    const {error} = await withTimeout(supabaseClient.rpc("submit_postcard",{
      p_title:title.value, p_category:category, p_details:details.value,
      p_stamp_artwork_id:stampArtworkId
    }),20000,"明信片寄送逾時，請稍後檢查再重試，避免重複提交。");
    if (error) throw error;
    postcardForm.reset();
    postcardStampSelect.value = "";
    updatePostcardStampPreview();
    postcardStatus.textContent = "明信片已成功寄給管理團隊，謝謝你的回饋！";
    alert("明信片已寄出！我們已收到你的問題與建議。");
  } catch (error) {
    console.error("Postcard submit error", error);
    postcardStatus.textContent = "寄送失敗：" + (error.message || "請稍後再試");
    alert("明信片寄送失敗：" + (error.message || "請稍後再試"));
  } finally {
    postcardSendBtn.disabled = false;
    postcardSendBtn.textContent = "Send ✦";
  }
});

/* =========================
   Admin Review / Report / Suggestion tabs
========================= */
let currentAdminSection = "review";
const adminSectionNames = ["review","report","suggestion"];
async function showAdminSection(name) {
  if (!isAdmin || !adminSectionNames.includes(name)) return;
  currentAdminSection = name;
  adminSectionNames.forEach(key => {
    const btn = document.querySelector(`[data-admin-tab="${key}"]`);
    const view = document.getElementById(`admin${key[0].toUpperCase()+key.slice(1)}View`);
    btn?.classList.toggle("active-admin-tab",key === name);
    btn?.setAttribute("aria-selected",String(key === name));
    view?.classList.toggle("hidden-panel",key !== name);
  });
  if (name === "report") await renderAdminReports();
  if (name === "suggestion") await renderAdminSuggestions();
}
document.querySelectorAll("[data-admin-tab]").forEach(btn => {
  btn.addEventListener("click", () => showAdminSection(btn.dataset.adminTab));
});

let adminReportArtworkMap = new Map();
async function renderAdminReports() {
  if (!isAdmin) return;
  const list = document.getElementById("adminReportList");
  list.textContent = "讀取檢舉案件中…";
  const {data:reports,error} = await supabaseClient.from("reports")
    .select("id,artwork_id,reason,status,created_at")
    .order("created_at",{ascending:false}).limit(200);
  if (error) {list.textContent = "讀取檢舉失敗："+error.message; return;}
  if (!reports?.length) {list.innerHTML='<p class="admin-empty">目前沒有檢舉案件。</p>';return;}
  const ids = [...new Set(reports.map(r=>r.artwork_id).filter(Boolean))];
  const {data:artworks,error:artworkError} = await supabaseClient.from("artworks")
    .select("id,title,image_url,image_path,pixel_data,review_status,is_public,story,created_at")
    .in("id",ids);
  if (artworkError) console.warn("Report artwork lookup:",artworkError.message);
  adminReportArtworkMap = new Map((artworks || []).map(a=>[a.id,a]));
  list.innerHTML = reports.map(report => {
    const a=adminReportArtworkMap.get(report.artwork_id);
    const src=a ? safeArtworkImageSource(a):"annomous.png";
    const date=report.created_at?new Date(report.created_at).toLocaleString():"";
    const status=report.status||"open";
    return `<article class="admin-message-card"><img src="${escapeAttr(src)}" alt="檢舉作品圖片" />
      <div><h4>${escapeHTML(a?.title || "作品已不存在")}</h4>
      <p class="admin-message-meta">${escapeHTML(date)} · ${escapeHTML(status)} · ${escapeHTML(report.artwork_id)}</p>
      <p><strong>檢舉原因：</strong>${escapeHTML(report.reason || "未填寫")}</p>
      <div class="admin-message-actions">
        ${a?`<button data-report-action="detail" data-artwork-id="${escapeAttr(a.id)}" type="button">查看作品</button>`:""}
        ${status === "open"?`<button data-report-action="reviewed" data-report-id="${escapeAttr(report.id)}" type="button">標記已處理</button>`:""}
      </div></div></article>`;
  }).join("");
}
document.getElementById("adminReportList")?.addEventListener("click",async event => {
  const btn=event.target.closest("button[data-report-action]");
  if (!btn || !isAdmin) return;
  if (btn.dataset.reportAction === "detail") {
    const a=adminReportArtworkMap.get(btn.dataset.artworkId);
    if (a) openArtworkModal(a);
  } else if (btn.dataset.reportAction === "reviewed") {
    btn.disabled = true;
    const {error} = await supabaseClient.from("reports")
      .update({status:"reviewed",updated_at:new Date().toISOString()})
      .eq("id",btn.dataset.reportId).eq("status","open");
    if (error) alert("更新案件失敗："+error.message);
    await renderAdminReports();
  }
});
document.getElementById("adminReportRefreshBtn")?.addEventListener("click", renderAdminReports);

let adminSuggestionStampMap = new Map();
async function renderAdminSuggestions() {
  if (!isAdmin) return;
  const list = document.getElementById("adminSuggestionList");
  list.textContent = "讀取明信片中…";
  const {data:letters,error} = await supabaseClient.from("postcards")
    .select("id,sender_id,title,category,details,stamp_artwork_id,status,created_at")
    .order("created_at",{ascending:false}).limit(200);
  if (error) {list.textContent = "讀取明信片失敗："+error.message; return;}
  if (!letters?.length) {list.innerHTML='<p class="admin-empty">目前尚未收到明信片。</p>';return;}
  const ids=[...new Set(letters.map(l=>l.stamp_artwork_id).filter(Boolean))];
  adminSuggestionStampMap = new Map();
  if (ids.length) {
    const {data,error:stampError}=await supabaseClient.from("artworks")
      .select("id,image_url,pixel_data,title").in("id",ids);
    if (stampError) console.warn("Postcard image lookup:",stampError.message);
    else adminSuggestionStampMap=new Map((data||[]).map(a=>[a.id,a]));
  }
  list.innerHTML=letters.map(letter=>{
    const stamp=adminSuggestionStampMap.get(letter.stamp_artwork_id);
    const image=stamp?safeArtworkImageSource(stamp):"annomous.png";
    const date=letter.created_at?new Date(letter.created_at).toLocaleString():"";
    const status=letter.status||"new";
    return `<article class="admin-message-card"><img src="${escapeAttr(image)}" alt="使用者明信片郵票" />
      <div><h4>${escapeHTML(letter.title)}</h4>
      <p class="admin-message-meta">${escapeHTML(date)} · ${escapeHTML(postcardCategoryLabels[letter.category]||letter.category)} · ${escapeHTML(status)}</p>
      <p>${escapeHTML(letter.details)}</p>
      <div class="admin-message-actions">${status==='new'?`<button data-postcard-action="read" data-postcard-id="${escapeAttr(letter.id)}" type="button">標記已讀</button>`:''}</div>
      </div></article>`;
  }).join("");
}
document.getElementById("adminSuggestionList")?.addEventListener("click",async event=>{
  const btn=event.target.closest("button[data-postcard-action]");
  if (!btn || !isAdmin) return;
  btn.disabled = true;
  const {error} = await supabaseClient.rpc("admin_mark_postcard_read",{p_postcard_id:btn.dataset.postcardId});
  if (error) alert("標記已讀失敗："+error.message);
  await renderAdminSuggestions();
});
document.getElementById("adminSuggestionRefreshBtn")?.addEventListener("click",renderAdminSuggestions);

/* =========================
   Init
========================= */

async function initApp() {
  createCanvas(Number(sizeSelect.value));
  clearPalette();
  hideDraftTools();
  updateGalleryTabs();
  updateFilterButtons();
  setTool("brush");
  updateHistoryButtons();
  updateDraftDepthLabel();

  await refreshAuthState();
  await renderGallery();

  if (isAdmin) {
    await renderAdminPage();
  }

  showPage("home");
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null;

  setTimeout(async () => {
    if (event === "PASSWORD_RECOVERY") {
      const newPassword = prompt("請輸入新密碼，至少 6 碼：");

      if (!newPassword || newPassword.length < 6) {
        alert("密碼未更新。新密碼至少需要 6 碼。");
        return;
      }

      const confirmPassword = prompt("請再次輸入新密碼：");

      if (newPassword !== confirmPassword) {
        alert("兩次輸入的密碼不一致，請重新點擊密碼重設信件。");
        return;
      }

      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        alert(`密碼更新失敗：${error.message}`);
        return;
      }

      alert("密碼已成功更新，請使用新密碼重新登入。");

      await supabaseClient.auth.signOut();

      currentUser = null;
      isAdmin = false;
      updateAuthNavbar();
      showPage("home");

      return;
    }

    if (currentUser) {
      await ensureProfile();
      await checkAdminStatus();
    } else {
      isAdmin = false;
      updateAuthNavbar();
    }

    await renderGallery();

    if (isAdmin) {
      await renderAdminPage();
    }
  }, 0);
});

initApp();

/* =========================
   Password Recovery Patch
   Add this block at the very end of script.js
========================= */

const resetPasswordModalPatch = document.getElementById("resetPasswordModal");
const newPasswordInputPatch = document.getElementById("newPasswordInput");
const confirmPasswordInputPatch = document.getElementById("confirmPasswordInput");
const updatePasswordBtnPatch = document.getElementById("updatePasswordBtn");
const resetPasswordHintPatch = document.getElementById("resetPasswordHint");

function pixalbumIsPasswordRecoveryUrl() {
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  const fullUrl = `${search}${hash}`.toLowerCase();

  return (
    fullUrl.includes("type=recovery") ||
    fullUrl.includes("recovery") ||
    fullUrl.includes("reset-password") ||
    fullUrl.includes("access_token") ||
    fullUrl.includes("refresh_token") ||
    fullUrl.includes("code=")
  );
}

function pixalbumOpenResetPasswordModal() {
  if (!resetPasswordModalPatch) {
    alert("Reset Password 視窗不存在，請確認 index.html 已經加入 resetPasswordModal。");
    return;
  }

  const authModal = document.getElementById("authModal");
  const artworkModal = document.getElementById("artworkModal");

  if (authModal) {
    authModal.classList.add("hidden-panel");
  }

  if (artworkModal) {
    artworkModal.classList.add("hidden-panel");
  }

  if (newPasswordInputPatch) {
    newPasswordInputPatch.value = "";
  }

  if (confirmPasswordInputPatch) {
    confirmPasswordInputPatch.value = "";
  }

  if (resetPasswordHintPatch) {
    resetPasswordHintPatch.className = "auth-hint";
    resetPasswordHintPatch.textContent = "更新成功後，系統會自動登出，請使用新密碼重新登入。";
  }

  resetPasswordModalPatch.classList.remove("hidden-panel");
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    if (newPasswordInputPatch) {
      newPasswordInputPatch.focus();
    }
  }, 150);
}

function pixalbumCloseResetPasswordModal() {
  if (!resetPasswordModalPatch) {
    return;
  }

  resetPasswordModalPatch.classList.add("hidden-panel");
  document.body.style.overflow = "";
}

async function pixalbumPreparePasswordRecovery() {
  if (!pixalbumIsPasswordRecoveryUrl()) {
    return;
  }

  try {
    const urlParams = new URLSearchParams(window.location.search || "");
    const code = urlParams.get("code");

    if (code) {
      const { error } = await supabaseClient.auth.exchangeCodeForSession(code);

      if (error) {
        console.warn("exchangeCodeForSession error:", error.message);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data || !data.session) {
      alert(
        "密碼重設連結已開啟，但沒有取得有效登入狀態。請重新寄送密碼重設信，並確認 Supabase Redirect URL 有設定 https://pixalbum.vercel.app/**"
      );
      return;
    }

    pixalbumOpenResetPasswordModal();
  } catch (error) {
    console.error("Password recovery prepare error:", error);
    alert(`密碼重設初始化失敗：${error.message || "Unknown error"}`);
  }
}

async function pixalbumUpdatePassword() {
  if (!newPasswordInputPatch || !confirmPasswordInputPatch || !updatePasswordBtnPatch) {
    alert("重設密碼表單尚未載入，請重新整理後再試。");
    return;
  }

  const newPassword = newPasswordInputPatch.value.trim();
  const confirmPassword = confirmPasswordInputPatch.value.trim();

  if (!newPassword || newPassword.length < 6) {
    if (resetPasswordHintPatch) {
      resetPasswordHintPatch.className = "auth-hint error";
      resetPasswordHintPatch.textContent = "密碼至少需要 6 碼。";
    }
    return;
  }

  if (newPassword !== confirmPassword) {
    if (resetPasswordHintPatch) {
      resetPasswordHintPatch.className = "auth-hint error";
      resetPasswordHintPatch.textContent = "兩次輸入的密碼不一致。";
    }
    return;
  }

  updatePasswordBtnPatch.disabled = true;
  updatePasswordBtnPatch.textContent = "Updating...";

  if (resetPasswordHintPatch) {
    resetPasswordHintPatch.className = "auth-hint";
    resetPasswordHintPatch.textContent = "正在更新密碼，請稍等...";
  }

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw error;
    }

    if (resetPasswordHintPatch) {
      resetPasswordHintPatch.className = "auth-hint success";
      resetPasswordHintPatch.textContent = "密碼已成功更新，即將登出。";
    }

    await supabaseClient.auth.signOut();

    window.history.replaceState({}, document.title, window.location.pathname);

    setTimeout(() => {
      pixalbumCloseResetPasswordModal();
      alert("密碼已成功更新，請使用新密碼重新登入。");
      window.location.href = "https://pixalbum.vercel.app";
    }, 800);
  } catch (error) {
    console.error("Update password error:", error);

    if (resetPasswordHintPatch) {
      resetPasswordHintPatch.className = "auth-hint error";
      resetPasswordHintPatch.textContent = `密碼更新失敗：${error.message || "Unknown error"}`;
    }
  } finally {
    updatePasswordBtnPatch.disabled = false;
    updatePasswordBtnPatch.textContent = "Update Password";
  }
}

if (updatePasswordBtnPatch) {
  updatePasswordBtnPatch.addEventListener("click", pixalbumUpdatePassword);
}

if (newPasswordInputPatch) {
  newPasswordInputPatch.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      pixalbumUpdatePassword();
    }
  });
}

if (confirmPasswordInputPatch) {
  confirmPasswordInputPatch.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      pixalbumUpdatePassword();
    }
  });
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" && session) {
    pixalbumOpenResetPasswordModal();
  }
});

window.addEventListener("load", () => {
  setTimeout(() => {
    pixalbumPreparePasswordRecovery();
  }, 800);
});