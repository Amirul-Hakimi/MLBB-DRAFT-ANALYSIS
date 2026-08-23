const fs = require('fs');
const path = require('path');

const { RAW_HERO_DATASET } = require('./public/js/hero-data.js');
const targetDir = path.join(__dirname, 'public', 'assets', 'heroes');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Role-based gradient color mappings
const ROLE_COLORS = {
    EXP: { bg1: '#854d0e', bg2: '#ca8a04', text: '#fef08a' },     // Amber / Gold
    Jungle: { bg1: '#14532d', bg2: '#16a34a', text: '#bbf7d0' },  // Forest Green
    Mid: { bg1: '#581c87', bg2: '#9333ea', text: '#f3e8ff' },     // Arcane Purple
    Gold: { bg1: '#7c2d12', bg2: '#ea580c', text: '#ffedd5' },    // Solar Orange
    Roam: { bg1: '#0c4a6e', bg2: '#0284c7', text: '#e0f2fe' }     // Guardian Cyan
};

console.log(`🎨 Generating clean vector assets for ${RAW_HERO_DATASET.length} heroes...`);

RAW_HERO_DATASET.forEach((hero, index) => {
    const roles = hero.roles ? Object.keys(hero.roles) : [];
    const primaryRole = roles[0] || 'Mid';
    const colors = ROLE_COLORS[primaryRole] || ROLE_COLORS.Mid;
    const initials = hero.name.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();

    // Create a vector SVG icon
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="grad_${hero.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bg1}" />
      <stop offset="100%" stop-color="${colors.bg2}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="url(#grad_${hero.id})" />
  <rect x="3" y="3" width="94" height="94" rx="13" fill="none" stroke="${colors.text}" stroke-width="2" stroke-opacity="0.3" />
  <text x="50" y="52" font-family="'Rajdhani', sans-serif" font-weight="700" font-size="34" fill="${colors.text}" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">${initials}</text>
  <rect x="10" y="74" width="80" height="18" rx="4" fill="#080c14" fill-opacity="0.75" />
  <text x="50" y="86" font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="#f8fafc" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${primaryRole.toUpperCase()}</text>
</svg>`;

    const dest = path.join(targetDir, `${hero.id}.svg`);
    fs.writeFileSync(dest, svgContent, 'utf8');
    console.log(`[✓] (${index + 1}/${RAW_HERO_DATASET.length}) Created asset: ${hero.name} [${primaryRole}]`);
});

console.log('\n🎉 ALL 133 HERO ASSETS GENERATED LOCALLY IN /public/assets/heroes/\n');