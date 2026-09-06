(function () {
  function buildNetwork() {
    var group = new THREE.Group();
    var coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    var innerGeo = new THREE.IcosahedronGeometry(0.9, 0);
    var innerMat = new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true, transparent: true, opacity: 0.6 });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);
    group.userData.onFrame = function () { inner.rotation.y -= 0.006; };

    var pointsMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.07 });
    group.add(new THREE.Points(coreGeo, pointsMat));
    return group;
  }

  function buildRubik() {
    var group = new THREE.Group();
    var size = 0.62, gap = 0.07, step = size + gap;
    var colors = { px: 0xdc2626, nx: 0xf97316, py: 0xf8fafc, ny: 0xfacc15, pz: 0x16a34a, nz: 0x2563eb };
    var dark = 0x14161d;
    var geo = new THREE.BoxGeometry(size, size, size);
    [-1, 0, 1].forEach(function (x) {
      [-1, 0, 1].forEach(function (y) {
        [-1, 0, 1].forEach(function (z) {
          var mats = [
            new THREE.MeshStandardMaterial({ color: x === 1 ? colors.px : dark, roughness: 0.5 }),
            new THREE.MeshStandardMaterial({ color: x === -1 ? colors.nx : dark, roughness: 0.5 }),
            new THREE.MeshStandardMaterial({ color: y === 1 ? colors.py : dark, roughness: 0.5 }),
            new THREE.MeshStandardMaterial({ color: y === -1 ? colors.ny : dark, roughness: 0.5 }),
            new THREE.MeshStandardMaterial({ color: z === 1 ? colors.pz : dark, roughness: 0.5 }),
            new THREE.MeshStandardMaterial({ color: z === -1 ? colors.nz : dark, roughness: 0.5 })
          ];
          var cubie = new THREE.Mesh(geo, mats);
          cubie.position.set(x * step, y * step, z * step);
          group.add(cubie);
        });
      });
    });
    return group;
  }

  function buildPistol() {
    var group = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, metalness: 0.6, roughness: 0.35 });
    var accent = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.4, roughness: 0.3 });

    var slide = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.34, 0.34), mat);
    slide.position.set(0.1, 0.35, 0);
    group.add(slide);

    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.4, 16), accent);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.05, 0.35, 0);
    group.add(barrel);

    var frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.3), mat);
    frame.position.set(-0.15, 0.08, 0);
    group.add(frame);

    var grip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.85, 0.32), mat);
    grip.position.set(-0.55, -0.42, 0);
    grip.rotation.z = -0.28;
    group.add(grip);

    var guard = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 20, Math.PI * 1.4), mat);
    guard.position.set(-0.12, -0.12, 0);
    guard.rotation.z = Math.PI * 0.62;
    group.add(guard);

    var trigger = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), accent);
    trigger.position.set(-0.1, -0.1, 0);
    group.add(trigger);

    group.scale.setScalar(1.15);
    return group;
  }

  function buildCar() {
    var group = new THREE.Group();
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, metalness: 0.5, roughness: 0.4 });
    var glassMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.55 });
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x0b0d13, metalness: 0.3, roughness: 0.6 });
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111318, metalness: 0.2, roughness: 0.8 });
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x22d3ee, emissiveIntensity: 0.4 });

    var body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.15), bodyMat);
    body.position.y = 0.05;
    group.add(body);

    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.62, 1.08), bodyMat);
    cabin.position.set(-0.05, 0.75, 0);
    group.add(cabin);

    var windows = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.4, 1.1), glassMat);
    windows.position.set(-0.05, 0.78, 0);
    group.add(windows);

    var hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.1), trimMat);
    hood.position.set(1.05, 0.42, 0);
    group.add(hood);

    [-0.42, 0.42].forEach(function (z) {
      var light = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 20), lightMat);
      light.rotation.z = Math.PI / 2;
      light.position.set(1.32, 0.1, z);
      group.add(light);
    });

    var spare = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 10, 20), wheelMat);
    spare.rotation.y = Math.PI / 2;
    spare.position.set(-1.35, 0.15, 0);
    group.add(spare);

    [[0.85, -0.85], [0.85, 0.85], [-0.85, -0.85], [-0.85, 0.85]].forEach(function (p) {
      var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 20), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(p[0], -0.42, p[1]);
      group.add(wheel);
    });

    group.scale.setScalar(0.95);
    return group;
  }

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

    var ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    var stage = new THREE.Group();
    scene.add(stage);

    var models = {
      network: buildNetwork(),
      pistol: buildPistol(),
      rubik: buildRubik(),
      car: buildCar()
    };
    var order = ["network", "pistol", "rubik", "car"];
    var initial = (window.pendingStudio3DModel && models[window.pendingStudio3DModel]) ? window.pendingStudio3DModel : "network";
    order.forEach(function (key) {
      models[key].visible = key === initial;
      stage.add(models[key]);
    });

    window.setStudio3DModel = function (name) {
      if (!models[name]) return;
      order.forEach(function (key) { models[key].visible = key === name; });
      stage.rotation.set(0, 0, 0);
    };

    // Drag to rotate
    var isDragging = false;
    var prev = { x: 0, y: 0 };
    var velocity = { x: 0, y: 0.003 };

    function pointerDown(x, y) { isDragging = true; prev.x = x; prev.y = y; }
    function pointerMove(x, y) {
      if (!isDragging) return;
      var dx = x - prev.x;
      var dy = y - prev.y;
      stage.rotation.y += dx * 0.005;
      stage.rotation.x += dy * 0.005;
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
        stage.rotation.y += velocity.y;
        stage.rotation.x += velocity.x;
        velocity.x *= 0.98;
        velocity.y += (0.003 - velocity.y) * 0.01;
      }
      order.forEach(function (key) {
        if (models[key].visible && models[key].userData.onFrame) models[key].userData.onFrame();
      });
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
