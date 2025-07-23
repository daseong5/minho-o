const downloadCardImage = (card, idx) => {

  const glare = card.querySelector('.crew_profile_overlay');
  const prevGlareDisplay = glare ? glare.style.display : null;
  if (glare) glare.style.display = 'none';

  const prevTransform = card.style.transform;
  card.style.transform = 'none';

  const prevBorderRadius = card.style.borderRadius;
  const prevBoxShadow = card.style.boxShadow;
  const prevBorder = card.style.border;
  card.style.borderRadius = '18px';
  card.style.boxShadow = '0 4px 24px 0 rgba(60,60,60,0.10), 0 1.5px 6px 0 rgba(60,60,60,0.04)';
  card.style.border = '1px solid #e0e0e0';

  window.html2canvas(card, {backgroundColor: null}).then(canvas => {
    card.style.transform = prevTransform;
    if (glare) glare.style.display = prevGlareDisplay;
    card.style.borderRadius = prevBorderRadius;
    card.style.boxShadow = prevBoxShadow;
    card.style.border = prevBorder;

    const link = document.createElement('a');
    link.download = `profile_card_${idx+1}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
};

document.querySelectorAll('.crew_profile_card').forEach((card, idx) => {
  let overlay = card.querySelector('.crew_profile_overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'crew_profile_overlay';
    card.appendChild(overlay);
  }

  const logo = card.querySelector('.Lab_logo_1');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.onclick = function(e) {
      downloadCardImage(card, idx);
      e.stopPropagation();
    };
  }

  card.addEventListener('mousemove', function(e){
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = -1/5 * x + 20;
    const rotateX = 4/30 * y - 20;

    overlay.style.backgroundPosition = `${x/5 + y/5}%`;
    overlay.style.filter = `opacity(${x/200}) brightness(1.2)`;

    card.style.transform = `perspective(350px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', function(){
    overlay.style.filter = 'opacity(0)';
    card.style.transform = 'perspective(350px) rotateY(0deg) rotateX(0deg)';
  });
});