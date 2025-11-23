export function showToast(message: string, timeout = 3000, position: string = 'bottom-right') {
  try {
    const containerId = `lsn-toast-container-${position}`;
    let container = document.getElementById(containerId) as HTMLDivElement | null;

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.zIndex = '2147483647';
      container.style.pointerEvents = 'none';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      // Positioning
      switch (position) {
        case 'bottom-left':
          container.style.left = '16px';
          container.style.bottom = '16px';
          container.style.alignItems = 'flex-start';
          break;
        case 'top-right':
          container.style.right = '16px';
          container.style.top = '16px';
          container.style.alignItems = 'flex-end';
          break;
        case 'top-left':
          container.style.left = '16px';
          container.style.top = '16px';
          container.style.alignItems = 'flex-start';
          break;
        case 'bottom-right':
        default:
          container.style.right = '16px';
          container.style.bottom = '16px';
          container.style.alignItems = 'flex-end';
          break;
      }
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.style.pointerEvents = 'auto';
    toast.style.background = 'rgba(0,0,0,0.82)';
    toast.style.color = '#fff';
    toast.style.padding = '8px 12px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
    toast.style.maxWidth = '360px';
    toast.style.fontSize = '13px';
    toast.style.lineHeight = '1.2';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    toast.innerText = message;

    // Dismiss on click
    toast.addEventListener('click', () => {
      hideToast(toast);
    });

    container.appendChild(toast);

    // Show animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Auto hide
    const hideTimeout = setTimeout(() => hideToast(toast), timeout);

    function hideToast(el: HTMLDivElement) {
      clearTimeout(hideTimeout);
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => {
        try {
          el.remove();
          // If container is empty, remove it
          if (container && container.childElementCount === 0) {
            container.remove();
          }
        } catch (e) {
          /* ignore */
        }
      }, 220);
    }
  } catch (e) {
    // If toast creation fails, fallback to alert
    try {
      alert(message);
    } catch (e2) {
      // swallow
    }
  }
}
