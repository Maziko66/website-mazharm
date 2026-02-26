document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

document.querySelectorAll('.tracks-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const list = btn.closest('.music-album').querySelector('.tracks-list');
    const open = list.classList.toggle('open');
    btn.textContent = open ? '▼ HIDE TRACKS' : '▶ SHOW TRACKS';
  });
});
