const CACHE_NAME = "craft-beer-sales-v8";
const ASSETS = [
  "./index.html",
  "./manifest.webmanifest"
];

const HISTORY_STYLE = `
<style id="history-style">
  .history {
    margin-top: 18px;
    border-top: 1px solid rgba(15, 23, 42, .1);
    padding-top: 16px;
  }

  .history-head {
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .history-title {
    font-size: 15px;
    font-weight: 800;
  }

  .history-list {
    display: grid;
    gap: 10px;
  }

  .history-empty {
    color: var(--muted);
    font-size: 13px;
    padding: 8px 0;
  }

  .history-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .history-tab {
    appearance: none;
    border: 1px solid rgba(15, 23, 42, .08);
    border-radius: 999px;
    background: rgba(255, 255, 255, .9);
    color: inherit;
    display: grid;
    flex: 0 0 auto;
    gap: 1px;
    max-width: 180px;
    min-width: 116px;
    padding: 9px 12px;
    text-align: left;
  }

  .history-tab.active {
    border-color: rgba(42, 157, 143, .6);
    background: rgba(42, 157, 143, .12);
  }

  .history-tab-name {
    font-size: 13px;
    font-weight: 800;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-tab-date {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-detail {
    background: rgba(255, 255, 255, .68);
    border: 1px solid rgba(15, 23, 42, .08);
    border-radius: 8px;
    padding: 10px;
  }

  .history-detail-head {
    display: grid;
    gap: 3px;
    margin-bottom: 9px;
  }

  .history-name {
    font-size: 14px;
    font-weight: 800;
  }

  .history-meta {
    color: var(--muted);
    font-size: 12px;
    margin-top: 2px;
  }

  .history-stats {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: 10px;
  }

  .history-stat {
    background: rgba(255, 255, 255, .78);
    border: 1px solid rgba(15, 23, 42, .08);
    border-radius: 8px;
    padding: 8px;
  }

  .history-stat-label {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .history-stat-value {
    font-size: 15px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .history-actions {
    display: flex;
    gap: 6px;
  }

  .history-actions .btn {
    min-height: 34px;
    padding: 8px 10px;
  }

  .history-actions .btn {
    flex: 1;
  }
</style>`;

const HISTORY_SCRIPT = `
<script id="history-script">
(() => {
  if (window.__craftBeerHistoryReady) return;
  window.__craftBeerHistoryReady = true;

  const historyKey = "craftBeerSalesHistory";
  const maxHistoryItems = 50;
  const $ = (selector) => document.querySelector(selector);
  let selectedHistoryId = "";

  const yen = (value) => new Intl.NumberFormat("ja-JP").format(value || 0) + "円";
  const parseYen = (text) => Number(String(text || "").replace(/[^0-9.-]/g, "")) || 0;

  const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const getValue = (id) => {
    const element = $("#" + id);
    return element ? element.value : "";
  };

  const setValue = (id, value) => {
    const element = $("#" + id);
    if (!element) return;
    element.value = value || "";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const getText = (id) => {
    const element = $("#" + id);
    return element ? element.textContent.trim() : "";
  };

  const showToast = (message) => {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1700);
  };

  const readHistory = () => {
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const writeHistory = (items) => {
    localStorage.setItem(historyKey, JSON.stringify(items.slice(0, maxHistoryItems)));
    renderHistory();
  };

  const currentEntry = () => {
    const now = new Date();
    const eventName = getValue("eventName").trim() || "クラフトビール";
    const eventDate = getValue("eventDate");

    return {
      id: String(now.getTime()) + "-" + Math.random().toString(16).slice(2),
      savedAt: now.toISOString(),
      eventName,
      eventDate,
      rawInput: getValue("rawInput"),
      expenseInput: getValue("expenseInput"),
      memo: getValue("memo"),
      cashSales: parseYen(getText("cashSales")),
      cashlessSales: parseYen(getText("cashlessSales")),
      totalSales: parseYen(getText("totalSales")),
      expenseTotal: parseYen(getText("expenseTotal")),
      profit: parseYen(getText("profit")),
      reportText: getValue("reportText") || getText("lineReport")
    };
  };

  const formatSavedAt = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  const saveHistory = () => {
    const entry = currentEntry();
    selectedHistoryId = entry.id;
    writeHistory([entry, ...readHistory()]);
    showToast("履歴に記録しました");
  };

  const restoreHistory = (id) => {
    const entry = readHistory().find((item) => item.id === id);
    if (!entry) return;
    setValue("eventName", entry.eventName || "クラフトビール");
    setValue("eventDate", entry.eventDate || "");
    setValue("rawInput", entry.rawInput || "");
    setValue("expenseInput", entry.expenseInput || "");
    setValue("memo", entry.memo || "");
    showToast("履歴を復元しました");
  };

  const deleteHistory = (id) => {
    const nextItems = readHistory().filter((item) => item.id !== id);
    if (selectedHistoryId === id) selectedHistoryId = nextItems[0]?.id || "";
    writeHistory(nextItems);
    showToast("履歴を削除しました");
  };

  const csvEscape = (value) => {
    const text = String(value ?? "");
    return /[",\\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };

  const historyCsv = () => {
    const headers = [
      "保存日時",
      "イベント名",
      "日付",
      "現金売上",
      "電子決済",
      "総売上",
      "経費",
      "利益",
      "メモ",
      "報告文"
    ];
    const rows = readHistory().map((item) => [
      item.savedAt,
      item.eventName,
      item.eventDate,
      item.cashSales,
      item.cashlessSales,
      item.totalSales,
      item.expenseTotal,
      item.profit,
      item.memo,
      item.reportText
    ]);
    return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\\n");
  };

  const downloadHistoryCsv = () => {
    const items = readHistory();
    if (!items.length) {
      showToast("履歴がまだありません");
      return;
    }
    const blob = new Blob(["\\uFEFF" + historyCsv()], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "craft-beer-sales-history.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  function renderHistory() {
    const list = $("#historyList");
    if (!list) return;

    const items = readHistory();
    if (!items.length) {
      selectedHistoryId = "";
      list.innerHTML = '<div class="history-empty">まだ記録はありません。</div>';
      return;
    }

    if (!items.some((item) => item.id === selectedHistoryId)) {
      selectedHistoryId = items[0].id;
    }

    const selected = items.find((item) => item.id === selectedHistoryId) || items[0];
    const tabs = items.map((item) => {
      const isActive = item.id === selected.id;
      return (
        '<button class="history-tab' + (isActive ? ' active' : '') + '" type="button" data-action="select" data-id="' + escapeHtml(item.id) + '" aria-pressed="' + (isActive ? 'true' : 'false') + '">' +
          '<span class="history-tab-name">' + escapeHtml(item.eventName || "クラフトビール") + '</span>' +
          '<span class="history-tab-date">' + escapeHtml(item.eventDate || formatSavedAt(item.savedAt) || "日付なし") + '</span>' +
        '</button>'
      );
    }).join("");

    list.innerHTML =
      '<div class="history-tabs" role="tablist" aria-label="履歴のイベント">' + tabs + '</div>' +
      '<div class="history-detail">' +
        '<div class="history-detail-head">' +
          '<div class="history-name">' + escapeHtml(selected.eventName || "クラフトビール") + '</div>' +
          '<div class="history-meta">' + escapeHtml((selected.eventDate || "日付なし") + " / 記録 " + formatSavedAt(selected.savedAt)) + '</div>' +
          (selected.memo ? '<div class="history-meta">' + escapeHtml(selected.memo) + '</div>' : '') +
        '</div>' +
        '<div class="history-stats">' +
          '<div class="history-stat"><div class="history-stat-label">総売上</div><div class="history-stat-value">' + yen(selected.totalSales) + '</div></div>' +
          '<div class="history-stat"><div class="history-stat-label">収支</div><div class="history-stat-value">' + yen(selected.profit) + '</div></div>' +
          '<div class="history-stat"><div class="history-stat-label">現金売上</div><div class="history-stat-value">' + yen(selected.cashSales) + '</div></div>' +
          '<div class="history-stat"><div class="history-stat-label">経費</div><div class="history-stat-value">' + yen(selected.expenseTotal) + '</div></div>' +
        '</div>' +
        '<div class="history-actions">' +
          '<button class="btn" type="button" data-action="restore" data-id="' + escapeHtml(selected.id) + '">復元</button>' +
          '<button class="btn ghost" type="button" data-action="delete" data-id="' + escapeHtml(selected.id) + '">削除</button>' +
        '</div>' +
      '</div>';
  }

  const setup = () => {
    const resultPanel = document.querySelector('[aria-labelledby="resultTitle"]');
    const controls = resultPanel ? resultPanel.querySelector(".panel-head .controls") : null;
    if (controls && !$("#saveHistoryBtn")) {
      controls.insertAdjacentHTML("beforeend", '<button class="btn" id="saveHistoryBtn" type="button">記録</button>');
    }

    const reportWrap = $(".report-wrap");
    if (reportWrap && !$("#historyList")) {
      reportWrap.insertAdjacentHTML(
        "afterend",
        '<div class="history" aria-labelledby="historyTitle">' +
          '<div class="history-head">' +
            '<div class="history-title" id="historyTitle">履歴</div>' +
            '<button class="btn ghost" id="downloadHistoryBtn" type="button">履歴CSV</button>' +
          '</div>' +
          '<div class="history-list" id="historyList"></div>' +
        '</div>'
      );
    }

    $("#saveHistoryBtn")?.addEventListener("click", saveHistory);
    $("#downloadHistoryBtn")?.addEventListener("click", downloadHistoryCsv);
    $("#historyList")?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const id = button.dataset.id;
      if (!id) return;
      if (button.dataset.action === "select") {
        selectedHistoryId = id;
        renderHistory();
      }
      if (button.dataset.action === "restore") restoreHistory(id);
      if (button.dataset.action === "delete") deleteHistory(id);
    });

    renderHistory();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
</script>`;

const injectHistory = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();
  if (!html.includes('id="history-style"')) {
    html = html.replace("</head>", `${HISTORY_STYLE}</head>`);
  }
  if (!html.includes('id="history-script"')) {
    html = html.replace("</body>", `${HISTORY_SCRIPT}</body>`);
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.delete("content-length");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return injectHistory(response);
        })
        .catch(() => caches.match("./index.html").then((cached) => cached && injectHistory(cached)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
