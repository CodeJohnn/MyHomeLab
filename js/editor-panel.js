(() => {
  const panel = document.getElementById('toolbar');
  if (!panel) return;
  const tabs = [...panel.querySelectorAll('[data-editor-tab]')];
  const sections = [...panel.querySelectorAll('[data-editor-section]')];
  function activateTab(name) {
    if (!sections.some(section => section.dataset.editorSection === name)) return;
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.editorTab === name)));
    sections.forEach(section => { section.hidden = section.dataset.editorSection !== name; });
  }
  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.editorTab)));
  activateTab('objects');
  const search = document.getElementById('objectSearch');
  const list = document.getElementById('list');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filterObjects() {
    const query = normalize(search.value);
    let count = 0;
    list.querySelectorAll('button').forEach(button => {
      button.hidden = !normalize(button.textContent).includes(query);
      if (!button.hidden) count++;
    });
    document.getElementById('objectCount').textContent = count + ' itens';
    document.getElementById('emptyObjectSearch').hidden = count > 0;
  }
  search.addEventListener('input', filterObjects);
  new MutationObserver(filterObjects).observe(list, { childList: true });
  filterObjects();
})();
