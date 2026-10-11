const select = document.querySelector('#theme-select');

const saved = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
select.value = saved;

select.addEventListener('change', (e) => {
  const theme = e.target.value;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
});