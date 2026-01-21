(() => {
  const statusEl = document.getElementById("status-pill");
  const playerEl = document.getElementById("player");
  const lyricsEl = document.getElementById("lyrics");
  const reloadBtn = document.getElementById("reload-btn");

  const jobId = (location.pathname.split("/status/")[1] || "").split(/[?#]/)[0];
  if (!jobId) {
    statusEl.textContent = "Job não encontrado";
    statusEl.className = "pill error";
    return;
  }

  reloadBtn.addEventListener("click", fetchStatus);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/status-simple/${jobId}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Falha ao buscar status");
      const data = await res.json();
      renderStatus(data);
    } catch (err) {
      console.error("Erro ao buscar status", err);
      statusEl.textContent = "Erro ao carregar status";
      statusEl.className = "pill error";
    }
  }

  function renderStatus(data) {
    const { status, songs = [] } = data || {};
    if (status === "DONE" && songs.length > 0) {
      statusEl.textContent = "Pronta para ouvir";
      statusEl.className = "pill ready";
      const first = songs[0];
      playerEl.innerHTML = `
        <div class="section">
          <span class="label">Player</span>
          <audio class="audio" controls preload="auto">
            <source src="${first.audioUrl}" type="audio/mpeg" />
            <source src="${first.audioUrl}" type="audio/mp4" />
            <source src="${first.audioUrl}" type="audio/wav" />
            Seu navegador não suporta o elemento de áudio.
          </audio>
        </div>`;
      lyricsEl.innerHTML = first.lyrics
        ? `<div class="section"><span class="label">Letra</span><pre>${escapeHtml(first.lyrics)}</pre></div>`
        : "";
    } else if (status === "FAILED") {
      statusEl.textContent = "Falha ao gerar música";
      statusEl.className = "pill error";
    } else {
      statusEl.textContent = "Processando...";
      statusEl.className = "pill progress";
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c] || c));
  }

  fetchStatus();
  setInterval(fetchStatus, 10000);
})();
