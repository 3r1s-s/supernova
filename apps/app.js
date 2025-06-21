function reportHeight() {
  const height = document.body.scrollHeight;
  parent.postMessage(
    { type: 'iframeHeight', height: height > 355 ? 355 : height },
    '*'
  );
}

window.addEventListener('load', reportHeight);

new ResizeObserver(reportHeight).observe(document.body);