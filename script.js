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
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authDisplayName = document.getElementById("authDisplayName");
const displayNameWrapper = document.getElementById("displayNameWrapper");
const authSubmitBtn = document.getElementById("authSubmitBtn");
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
let isMouseDown = false;
let currentGalleryMode = "public";
let currentPublicFilter = "all";
let editingArtworkId = null;
let editingArtworkImagePath = null;

let extractedPaletteColors = [];
let currentPalettePage = 1;

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

/* =========================
   Auth
========================= */

function getDisplayNameFromUser(user) {
  if (!user) {
    return "匿名使用者";
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
  if (currentUser) {
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
  authMode = mode;
  updateAuthMode();

  authEmail.value = "";
  authPassword.value = "";
  authDisplayName.value = "";

  authModal.classList.remove("hidden-panel");
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
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
    authHint.textContent = "Already have an account? Sign in to manage your artworks.";
  } else {
    signUpTab.classList.add("active-auth-tab");
    displayNameWrapper.classList.remove("hidden-panel");
    authSubmitBtn.textContent = "Sign Up";
    authHint.textContent = "New here? Create an account to start saving artworks.";
  }
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

  try {
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

    if (error) {
      throw error;
    }

    currentUser = data.user || null;
    closeAuthModal();

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

    alert("註冊完成。若 Supabase 要求 Email 驗證，請先到信箱確認。");
  } catch (error) {
    console.error("Auth error:", error);
    alert(`${authMode === "signin" ? "登入" : "註冊"}失敗：${error.message || "Unknown error"}`);
  } finally {
    authSubmitBtn.disabled = false;
    updateAuthMode();
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
  authMode = "signin";
  updateAuthMode();
});

signUpTab.addEventListener("click", () => {
  authMode = "signup";
  updateAuthMode();
});

authSubmitBtn.addEventListener("click", submitAuthForm);

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
  if (!currentUser) {
    alert("正式資料庫版需要先登入才能儲存作品。請先按右上角 Sign In 或 Sign Up。");
  }

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

    showPage(page);
  });
});

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
    gallerySubtitle.textContent = "Featured and popular artworks are ranked by interaction.";
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
  modalArtworkImage.src = artwork.image_url || pixelDataToImage(artwork.pixel_data);
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

    if (button.classList.contains("rating-btn")) {
      await rateArtworkById(id, Number(button.dataset.score));
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
    draftDepth: Number(draftDepthSlider.value || DEFAULT_DRAFT_DEPTH),
    paletteVisible: !palettePanel.classList.contains("hidden-panel"),
    draftToolsVisible: !draftDepthWrapper.classList.contains("hidden-panel")
  };
}

function applyCanvasSnapshot(snapshot) {
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

  currentColor = snapshot.currentColor || "#1f4e79";
  colorPicker.value = currentColor;

  extractedPaletteColors = [...(snapshot.extractedPaletteColors || [])];
  currentPalettePage = snapshot.currentPalettePage || 1;

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

  setTool(snapshot.currentTool || "brush");
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

    cell.addEventListener("mousedown", () => {
      isMouseDown = true;

      if (currentTool === "brush" || currentTool === "eraser" || currentTool === "bucket") {
        pushUndoState();
      }

      handleCellAction(cell);
    });

    cell.addEventListener("mouseover", () => {
      if (isMouseDown && (currentTool === "brush" || currentTool === "eraser")) {
        handleCellAction(cell);
      }
    });

    cell.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    canvas.appendChild(cell);
  }
}

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

document.body.addEventListener("mouseup", () => {
  isMouseDown = false;
});

colorPicker.addEventListener("input", event => {
  currentColor = event.target.value;
  setTool("brush");
  updateSelectedPaletteColor(currentColor);
});

clearBtn.addEventListener("click", () => {
  pushUndoState();
  createCanvas(Number(sizeSelect.value));
  clearPalette();
  hideDraftTools();
  setTool("brush");
});

sizeSelect.addEventListener("change", event => {
  const size = Number(event.target.value);

  pushUndoState();
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
  renderImagePalettePage();

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

  pushUndoState();

  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();

    img.onload = function () {
      applyImageElementToPixelDraft(img);
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
  if (!currentUser) {
    alert("請先登入後再使用 AI 生成底稿。");
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

    aiDraftStatus.className = "ai-draft-status success";
    aiDraftStatus.textContent = `AI 底稿已生成，並已依 ${size} × ${size} 畫布轉為較清晰的像素參考底稿。`;

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

function renderImagePalettePage() {
  imagePalette.innerHTML = "";

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

  if (currentPalettePage === 1 && pageColors.length > 0) {
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

  const size = pixelData.size;
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

async function uploadArtworkImage(pixelData, existingPath = null) {
  const imageDataUrl = pixelDataToImage(pixelData);
  const blob = dataURLToBlob(imageDataUrl);
  const path = existingPath || `${currentUser.id}/${crypto.randomUUID()}.png`;

  const { error } = await supabaseClient.storage
    .from("artworks")
    .upload(path, blob, {
      contentType: "image/png",
      upsert: true
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
    alert("請先登入後再儲存作品。");
    return;
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
        lifecycle_status: "active"
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (wantsPublic) {
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

    alert("作品已成功儲存到 Supabase。若有勾選公開，會先經過 AI 審核。");
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

  try {
    const pixelData = getPixelData();
    const uploaded = await uploadArtworkImage(pixelData, editingArtworkImagePath);
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
        lifecycle_status: "active"
      })
      .eq("id", editingArtworkId)
      .eq("user_id", currentUser.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (wantsPublic) {
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

    alert("作品已更新。若有勾選公開，會重新送 AI 審核。");
  } catch (error) {
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

  loadPixelDataToCanvas(data.pixel_data);

  artTitle.value = data.title || "";
  artStory.value = data.story || "";
  publishCheckbox.checked = data.is_public && data.review_status === "approved";

  imageUpload.value = "";
  aiPromptInput.value = "";
  aiDraftStatus.textContent = "";
  aiDraftStatus.className = "ai-draft-status";

  clearPalette();
  hideDraftTools();

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
  if (!artwork.featured && artwork.lifecycle_status !== "featured") {
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

function renderRatingButtons(artworkId) {
  return [1, 2, 3, 4, 5].map(score => {
    return `
      <button class="rating-btn" data-id="${escapeAttr(artworkId)}" data-score="${score}" type="button">
        ${score}★
      </button>
    `;
  }).join("");
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
        .order("ratings_avg", { ascending: false })
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

    const imageUrl = artwork.image_url || pixelDataToImage(artwork.pixel_data);
    const safeImageUrl = escapeAttr(imageUrl);
    const badgeText = artwork.is_public ? "Public" : "Private";
    const badgeClass = artwork.is_public ? "public-badge" : "private-badge";
    const authorName = artwork.display_name || getDisplayNameFromUser(currentUser);
    const createdText = artwork.created_at ? new Date(artwork.created_at).toLocaleString() : "";
    const ratingText = Number(artwork.ratings_avg || 0) > 0
      ? `${Number(artwork.ratings_avg).toFixed(1)} / 5`
      : "尚無評分";

    const publicBackActions = `
      <div class="card-actions">
        <button class="card-btn detail-btn detail-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
          查看詳情
        </button>
      </div>

      <button class="like-btn like-art-btn" data-id="${escapeAttr(artwork.id)}" type="button">
        ♡ Like
      </button>

      <div class="rating-area">
        <h4>快速評分</h4>
        <div class="rating-buttons">
          ${renderRatingButtons(artwork.id)}
        </div>
      </div>

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
          ${renderLifecycleStatus(artwork)}
          <p class="like-row">♡ ${escapeHTML(artwork.likes_count || 0)} likes</p>
          <p class="rating-row">★ ${escapeHTML(ratingText)}</p>
          <p class="flip-hint">點擊查看作品背面故事</p>
        </div>

        <div class="art-card-back">
          <h3>${escapeHTML(artwork.title || "Untitled Artwork")}</h3>
          <p>${escapeHTML(artwork.story || "尚未新增作品說明。")}</p>
          <p class="like-row">♡ ${escapeHTML(artwork.likes_count || 0)} likes</p>
          <p class="rating-row">★ ${escapeHTML(ratingText)}</p>
          ${renderReviewStatus(artwork)}
          ${renderLifecycleStatus(artwork)}

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

async function rateArtworkById(id, score) {
  if (!currentUser) {
    alert("請先登入後再評分。");
    return;
  }

  const safeScore = Number(score);

  if (!Number.isInteger(safeScore) || safeScore < 1 || safeScore > 5) {
    alert("評分數值不正確。");
    return;
  }

  const { error } = await supabaseClient
    .from("ratings")
    .upsert({
      artwork_id: id,
      user_id: currentUser.id,
      score: safeScore
    }, {
      onConflict: "artwork_id,user_id"
    });

  if (error) {
    alert(`評分失敗：${error.message}`);
    return;
  }

  await renderGallery();

  if (isAdmin) {
    await renderAdminPage();
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

  await callAIReview(id);
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

  if (!confirmDelete) {
    return;
  }

  const artwork = await fetchArtworkById(id);

  if (artwork && artwork.image_path) {
    await supabaseClient.storage
      .from("artworks")
      .remove([artwork.image_path]);
  }

  const { error } = await supabaseClient
    .from("artworks")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUser.id);

  if (error) {
    alert(`刪除失敗：${error.message}`);
    return;
  }

  await renderGallery();

  if (isAdmin) {
    await renderAdminPage();
  }
}

async function downloadArtworkById(id) {
  const artwork = await fetchArtworkById(id);

  if (!artwork) {
    return;
  }

  const imageUrl = artwork.image_url || pixelDataToImage(artwork.pixel_data);

  const link = document.createElement("a");
  link.download = `${sanitizeFileName(artwork.title || "pixalbum_artwork")}.png`;
  link.href = imageUrl;
  link.click();
}

function downloadCurrentArtwork() {
  if (!hasUserDrawing()) {
    alert("請至少手動填色或繪製一格後再下載。");
    return;
  }

  const pixelData = getPixelData();
  const imageUrl = pixelDataToImage(pixelData);

  const link = document.createElement("a");
  const title = artTitle.value.trim() || "pixalbum_artwork";

  link.download = `${sanitizeFileName(title)}.png`;
  link.href = imageUrl;
  link.click();
}

downloadBtn.addEventListener("click", downloadCurrentArtwork);

/* =========================
   Admin Review
========================= */

function isReviewQueueArtwork(artwork) {
  return (
    artwork.review_status === "reviewing" ||
    artwork.review_status === "pending" ||
    artwork.review_status === "rejected" ||
    artwork.lifecycle_status === "low_activity" ||
    artwork.lifecycle_status === "pending_delete"
  );
}

function isPublicManagementArtwork(artwork) {
  return artwork.review_status === "approved" && artwork.is_public === true;
}

function getAdminCardClass(artwork) {
  if (artwork.review_status === "approved") {
    return "admin-card-approved";
  }

  if (artwork.review_status === "rejected" || artwork.lifecycle_status === "pending_delete") {
    return "admin-card-danger";
  }

  if (artwork.review_status === "pending" || artwork.lifecycle_status === "low_activity") {
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
  const imageUrl = artwork.image_url || pixelDataToImage(artwork.pixel_data);
  const createdText = artwork.created_at ? new Date(artwork.created_at).toLocaleString() : "—";
  const ownerName = artwork.display_name || "匿名使用者";
  const reviewLabel = artwork.review_status || "private";
  const lifecycleLabel = artwork.lifecycle_status || "active";
  const visibilityLabel = artwork.is_public ? "Public" : "Private";
  const visibilityClass = artwork.is_public ? "admin-chip-public" : "admin-chip-private";
  const ratingText = Number(artwork.ratings_avg || 0) > 0
    ? Number(artwork.ratings_avg).toFixed(1)
    : "—";

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
        <span class="admin-status-chip ${escapeAttr(getAdminLifecycleChipClass(artwork))}">${escapeHTML(lifecycleLabel)}</span>
      </div>

      <div class="admin-card-story">
        ${escapeHTML(truncateText(artwork.story || "尚未新增作品說明。", 140))}
      </div>

      <div class="admin-stats">
        <span>♡ ${escapeHTML(artwork.likes_count || 0)}</span>
        <span>★ ${escapeHTML(ratingText)}</span>
        <span>💬 ${escapeHTML(artwork.comments_count || 0)}</span>
      </div>

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

  return data || [];
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

  await refreshAdminAndGallery();
}

async function adminDeleteArtwork(id) {
  if (!isAdmin) {
    alert("你沒有管理者權限。");
    return;
  }

  const confirmDelete = confirm("管理者刪除：確定要永久刪除這件作品嗎？這會刪除資料庫作品與 Storage 圖片。");

  if (!confirmDelete) {
    return;
  }

  const artwork = await fetchArtworkById(id);

  if (artwork && artwork.image_path) {
    const { error: storageError } = await supabaseClient.storage
      .from("artworks")
      .remove([artwork.image_path]);

    if (storageError) {
      console.warn("Admin storage delete error:", storageError.message);
    }
  }

  const { error } = await supabaseClient
    .from("artworks")
    .delete()
    .eq("id", id);

  if (error) {
    alert(`Delete 失敗：${error.message}`);
    return;
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
