(function () {
  function init() {
    var wrap = document.getElementById("studio3d-canvas-wrap");
    if (!wrap || typeof THREE === "undefined") return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    wrap.appendChild(renderer.domElement);

    var group = new THREE.Group();
    scene.add(group);

    // Wireframe icosphere representing a security network
    var coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 });
    var core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    var innerGeo = new THREE.IcosahedronGeometry(0.9, 0);
    var innerMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true, transparent: true, opacity: 0.6 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    // Node points at icosahedron vertices
    var pointsMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.07 });
    var points = new THREE.Points(coreGeo, pointsMat);
    group.add(points);

    var ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // Drag to rotate
    var isDragging = false;
    var prev = { x: 0, y: 0 };
    var velocity = { x: 0, y: 0.003 };

    function pointerDown(x, y) { isDragging = true; prev.x = x; prev.y = y; }
    function pointerMove(x, y) {
      if (!isDragging) return;
      var dx = x - prev.x;
      var dy = y - prev.y;
      group.rotation.y += dx * 0.005;
      group.rotation.x += dy * 0.005;
      velocity.x = dy * 0.0002;
      velocity.y = dx * 0.0002;
      prev.x = x; prev.y = y;
    }
    function pointerUp() { isDragging = false; }

    wrap.addEventListener("mousedown", function (e) { pointerDown(e.clientX, e.clientY); });
    window.addEventListener("mousemove", function (e) { pointerMove(e.clientX, e.clientY); });
    window.addEventListener("mouseup", pointerUp);

    wrap.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      pointerDown(t.clientX, t.clientY);
    }, { passive: true });
    wrap.addEventListener("touchmove", function (e) {
      var t = e.touches[0];
      pointerMove(t.clientX, t.clientY);
    }, { passive: true });
    wrap.addEventListener("touchend", pointerUp);

    function animate() {
      requestAnimationFrame(animate);
      if (!isDragging) {
        group.rotation.y += velocity.y;
        group.rotation.x += velocity.x;
        velocity.x *= 0.98;
        velocity.y += (0.003 - velocity.y) * 0.01;
      }
      inner.rotation.y -= 0.006;
      renderer.render(scene, camera);
    }
    animate();

    function resize() {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(wrap);
    }
  }

  window.initStudio3D = init;
})();
