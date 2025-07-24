const downloadCardImage = (card, idx) => {
  // 글레어 완전 제거
  const glare = card.querySelector('.crew_profile_overlay');
  let glareParent = null, glareNext = null;
  if (glare) {
    glareParent = glare.parentNode;
    glareNext = glare.nextSibling;
    glareParent.removeChild(glare);
  }

  // 현재 transform 저장 및 회전 제거
  const prevTransform = card.style.transform;
  card.style.transform = 'none';

  // 외곽선 스타일 임시 적용
  const prevBorderRadius = card.style.borderRadius;
  const prevBoxShadow = card.style.boxShadow;
  const prevBorder = card.style.border;
  card.style.borderRadius = '18px';
  card.style.boxShadow = '0 4px 24px 0 rgba(60,60,60,0.10), 0 1.5px 6px 0 rgba(60,60,60,0.04)';
  card.style.border = '1px solid #e0e0e0';

  window.html2canvas(card, {backgroundColor: null}).then(canvas => {
    // 복원
    card.style.transform = prevTransform;
    card.style.borderRadius = prevBorderRadius;
    card.style.boxShadow = prevBoxShadow;
    card.style.border = prevBorder;
    if (glare && glareParent) {
      if (glareNext) {
        glareParent.insertBefore(glare, glareNext);
      } else {
        glareParent.appendChild(glare);
      }
    }

    // 이미지 다운로드
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

  let startX = 0, startY = 0;
  card.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      const rect = card.getBoundingClientRect();
      startX = e.touches[0].clientX - rect.left;
      startY = e.touches[0].clientY - rect.top;
    }
  });
  card.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1) {
      const rect = card.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * 10;
      const rotateY = ((x - centerX) / centerX) * -10;
      card.style.transform = `perspective(350px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }
  });
  card.addEventListener('touchend', function() {
    card.style.transform = '';
  });
});

// --- 흔들림 효과 ---
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.crew_profile_card').forEach((card, idx) => {
    setTimeout(() => {
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 850);
    }, idx * 120);
  });
});

function getClosestCardToCenter() {
  const cards = Array.from(document.querySelectorAll('.crew_profile_card'));
  const centerY = window.innerHeight / 2;
  let minDist = Infinity, closest = null;
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.top + rect.height / 2;
    const dist = Math.abs(cardCenter - centerY);
    if (dist < minDist) {
      minDist = dist;
      closest = card;
    }
  });
  return closest;
}

let lastShaken = null;
window.addEventListener('scroll', () => {
  const closest = getClosestCardToCenter();
  if (closest && closest !== lastShaken) {
    if (lastShaken) lastShaken.classList.remove('shake');
    closest.classList.add('shake');
    setTimeout(() => closest.classList.remove('shake'), 650);
    lastShaken = closest;
  }
});
// --- 기존 코드 이어짐 ---