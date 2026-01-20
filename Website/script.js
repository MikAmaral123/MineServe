// Lucide icons init
lucide.createIcons();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    });
});

// Subtle Parallax
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    document.querySelector('.background').style.transform = `scale(1.05) translate(${x * -10}px, ${y * -10}px)`;
});

console.log("Looking at the source code? Nice. We should hire you. 😉");

// GitHub Release Fetcher
const REPO = { owner: 'MikAmaral123', name: 'MineServe' };

async function fetchLatestRelease() {
    try {
        const res = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}/releases/latest`);
        if (!res.ok) return; // Silent fail

        const data = await res.json();

        // Update elements
        const badge = document.querySelector('.badge');
        if (badge) badge.textContent = `${data.tag_name} Available Now`;

        const downloadBtn = document.querySelector('.cta-group .btn-primary');
        if (downloadBtn) {
            const exe = data.assets.find(a => a.name.endsWith('.exe'));
            downloadBtn.href = exe ? exe.browser_download_url : data.html_url;
        }
    } catch (e) {
        // console.warn("GitHub API limit reached probably", e);
    }
}

fetchLatestRelease();

// 3D Tilt Logic
const showcase = document.querySelector('.app-showcase');
const screenshot = document.querySelector('.screenshot');

if (showcase && screenshot) {
    showcase.addEventListener('mousemove', (e) => {
        const rect = showcase.getBoundingClientRect();

        // Math magic
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;

        screenshot.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    showcase.addEventListener('mouseleave', () => {
        screenshot.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
    });
}
