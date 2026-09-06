(function () {
  function edged(mesh, color, opacity, angle) {
    var edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, angle !== undefined ? angle : 32),
      new THREE.LineBasicMaterial({ color: color !== undefined ? color : 0x000000, transparent: true, opacity: opacity !== undefined ? opacity : 0.35 })
    );
    mesh.add(edges);
    return mesh;
  }

  function castRecv(obj) {
    obj.traverse(function (o) {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    return obj;
  }

  // ---- Rounded-box helpers (ExtrudeGeometry-based, since r128 has no RoundedBoxGeometry) ----
  function roundedRectShape(w, h, r) {
    r = Math.max(Math.min(r, w / 2, h / 2), 0.0001);
    var x = -w / 2, y = -h / 2;
    var s = new THREE.Shape();
    s.moveTo(x, y + r);
    s.lineTo(x, y + h - r);
    s.quadraticCurveTo(x, y + h, x + r, y + h);
    s.lineTo(x + w - r, y + h);
    s.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    s.lineTo(x + w, y + r);
    s.quadraticCurveTo(x + w, y, x + w - r, y);
    s.lineTo(x + r, y);
    s.quadraticCurveTo(x, y, x, y + r);
    return s;
  }

  function extrudeRounded(w, h, depth, radius, bevel) {
    bevel = bevel !== undefined ? bevel : radius * 0.55;
    bevel = Math.max(Math.min(bevel, depth / 2 - 0.002, radius), 0.001);
    var shape = roundedRectShape(w, h, radius);
    var coreDepth = Math.max(depth - bevel * 2, 0.002);
    var geo = new THREE.ExtrudeGeometry(shape, {
      depth: coreDepth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.15,
      bevelOffset: -bevel * 0.15,
      bevelSegments: 3,
      curveSegments: 6
    });
    geo.translate(0, 0, -depth / 2 + bevel);
    geo.computeVertexNormals();
    return geo;
  }

  // Rounded box extruded along world X (length axis)
  function roundedBoxX(sizeX, sizeY, sizeZ, radius, bevel) {
    var geo = extrudeRounded(sizeZ, sizeY, sizeX, radius, bevel);
    geo.rotateY(Math.PI / 2);
    return geo;
  }

  // Rounded box extruded along world Y (vertical axis)
  function roundedBoxY(sizeX, sizeY, sizeZ, radius, bevel) {
    var geo = extrudeRounded(sizeX, sizeZ, sizeY, radius, bevel);
    geo.rotateX(Math.PI / 2);
    return geo;
  }

  // Flat rounded plate in the XY plane (thin extrude along Z) — used for stickers/panels
  function roundedPlate(w, h, thickness, radius) {
    return extrudeRounded(w, h, thickness, radius, thickness * 0.4);
  }

  function buildNetwork() {
    var group = new THREE.Group();

    var coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.8 });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    var innerGeo = new THREE.IcosahedronGeometry(0.9, 0);
    var innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x1c2333, metalness: 0.4, roughness: 0.25, transmission: 0.15,
      transparent: true, opacity: 0.55, clearcoat: 0.6, emissive: 0x0a1a33, emissiveIntensity: 0.3
    });
    var inner = new THREE.Mesh(innerGeo, innerMat);
    inner.castShadow = true;
    group.add(inner);
    group.userData.onFrame = function () { inner.rotation.y -= 0.006; };

    // Glowing node points at every vertex of the outer icosahedron, connected by thin data-link tubes
    var pos = coreGeo.attributes.position;
    var seen = {};
    var verts = [];
    for (var i = 0; i < pos.count; i++) {
      var v = new THREE.Vector3().fromBufferAttribute(pos, i);
      var key = v.x.toFixed(2) + "_" + v.y.toFixed(2) + "_" + v.z.toFixed(2);
      if (!seen[key]) { seen[key] = true; verts.push(v); }
    }

    var nodeGeo = new THREE.SphereGeometry(0.045, 12, 12);
    var nodeMat = new THREE.MeshStandardMaterial({ color: 0x67e8f9, emissive: 0x22d3ee, emissiveIntensity: 1.4, roughness: 0.3, metalness: 0.1 });
    var nodesGroup = new THREE.Group();
    verts.forEach(function (v) {
      var node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(v);
      nodesGroup.add(node);
    });
    group.add(nodesGroup);

    var linkMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.45 });
    var linkGroup = new THREE.Group();
    var maxLinks = 22, added = 0;
    for (var a = 0; a < verts.length && added < maxLinks; a++) {
      for (var b = a + 1; b < verts.length && added < maxLinks; b++) {
        var d = verts[a].distanceTo(verts[b]);
        if (d < 1.9) {
          var mid = new THREE.Vector3().addVectors(verts[a], verts[b]).multiplyScalar(0.5);
          var dir = new THREE.Vector3().subVectors(verts[b], verts[a]);
          var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, dir.length(), 6), linkMat);
          tube.position.copy(mid);
          tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          linkGroup.add(tube);
          added++;
        }
      }
    }
    group.add(linkGroup);

    var pointsMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 0.05, transparent: true, opacity: 0.7 });
    group.add(new THREE.Points(coreGeo, pointsMat));

    return group;
  }

  function buildRubik() {
    var group = new THREE.Group();
    var size = 0.64, gap = 0.04, step = size + gap;

    var colors = { px: 0xc41e1e, nx: 0xe8590c, py: 0xf5f5f0, ny: 0xf4d613, pz: 0x0f9d4a, nz: 0x1b4bd1 };
    function sticker(color) {
      return new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.4 });
    }
    var stickerGeo = roundedPlate(size * 0.84, size * 0.84, 0.045, 0.09);
    var edgeOff = 0.012;

    [-1, 0, 1].forEach(function (x) {
      [-1, 0, 1].forEach(function (y) {
        [-1, 0, 1].forEach(function (z) {
          if (x === 0 && y === 0 && z === 0) return;
          // Rounded plastic cubie body behind the stickers so the gaps read as bevelled edges, not flat gloss.
          var cubie = new THREE.Mesh(roundedBoxX(size, size, size, 0.09), new THREE.MeshPhysicalMaterial({ color: 0x111214, roughness: 0.6, clearcoat: 0.25, envMapIntensity: 0.35 }));
          cubie.position.set(x * step, y * step, z * step);
          cubie.castShadow = cubie.receiveShadow = true;
          group.add(cubie);

          var faces = [
            { cond: x === 1, color: colors.px, rot: [0, Math.PI / 2, 0], off: [size / 2 + edgeOff, 0, 0] },
            { cond: x === -1, color: colors.nx, rot: [0, -Math.PI / 2, 0], off: [-size / 2 - edgeOff, 0, 0] },
            { cond: y === 1, color: colors.py, rot: [-Math.PI / 2, 0, 0], off: [0, size / 2 + edgeOff, 0] },
            { cond: y === -1, color: colors.ny, rot: [Math.PI / 2, 0, 0], off: [0, -size / 2 - edgeOff, 0] },
            { cond: z === 1, color: colors.pz, rot: [0, 0, 0], off: [0, 0, size / 2 + edgeOff] },
            { cond: z === -1, color: colors.nz, rot: [0, Math.PI, 0], off: [0, 0, -size / 2 - edgeOff] }
          ];
          faces.forEach(function (f) {
            if (!f.cond) return;
            var mesh = new THREE.Mesh(stickerGeo, sticker(f.color));
            mesh.position.set(x * step + f.off[0], y * step + f.off[1], z * step + f.off[2]);
            mesh.rotation.set(f.rot[0], f.rot[1], f.rot[2]);
            mesh.castShadow = true;
            group.add(mesh);
          });
        });
      });
    });
    return group;
  }

  function buildPistol() {
    var group = new THREE.Group();
    var polymer = new THREE.MeshPhysicalMaterial({ color: 0x1b1c1f, roughness: 0.7, clearcoat: 0.2, clearcoatRoughness: 0.5 });
    var steel = new THREE.MeshPhysicalMaterial({ color: 0x4a4e57, metalness: 0.95, roughness: 0.22, clearcoat: 0.3, clearcoatRoughness: 0.2 });
    var darkSteel = new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0.85, roughness: 0.35 });
    var brushed = new THREE.MeshStandardMaterial({ color: 0x2b2d33, metalness: 0.8, roughness: 0.5 });
    var accent = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e5a66, emissiveIntensity: 0.4, metalness: 0.4, roughness: 0.25 });
    var brass = new THREE.MeshStandardMaterial({ color: 0xd8b463, metalness: 0.9, roughness: 0.3 });

    // Slide (upper, steel) — rounded top edge instead of a sharp box
    var slide = edged(new THREE.Mesh(roundedBoxX(1.95, 0.32, 0.36, 0.05), steel), 0x000000, 0.35, 45);
    slide.position.set(0.12, 0.36, 0);
    group.add(slide);

    // Ejection port cut-out (visual recess) + a hint of brass casing inside it
    var port = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.2), darkSteel);
    port.position.set(0.18, 0.5, 0);
    group.add(port);
    var casing = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12), brass);
    casing.rotation.z = Math.PI / 2;
    casing.position.set(0.2, 0.49, 0.02);
    group.add(casing);

    // Rear + front slide serrations (grooves for racking grip)
    for (var i = 0; i < 7; i++) {
      var groove = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.3, 0.38), darkSteel);
      groove.position.set(-0.68 + i * 0.05, 0.36, 0);
      group.add(groove);
    }
    for (var fi = 0; fi < 5; fi++) {
      var fgroove = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.38), darkSteel);
      fgroove.position.set(0.66 + fi * 0.045, 0.36, 0);
      group.add(fgroove);
    }

    // Rear sight (notch) & front sight (post with accent dot)
    var rearSight = new THREE.Mesh(roundedBoxX(0.09, 0.07, 0.3, 0.015), darkSteel);
    rearSight.position.set(-0.8, 0.55, 0);
    group.add(rearSight);
    var frontSightBody = new THREE.Mesh(roundedBoxX(0.05, 0.08, 0.05, 0.012), darkSteel);
    frontSightBody.position.set(1.0, 0.55, 0);
    group.add(frontSightBody);
    var frontSightDot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), accent);
    frontSightDot.position.set(1.0, 0.58, 0);
    group.add(frontSightDot);

    // Barrel / muzzle with visible crown + accent bushing
    var barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 28), steel);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(1.08, 0.36, 0);
    group.add(barrel);
    var bore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.2, roughness: 0.9 }));
    bore.rotation.z = Math.PI / 2;
    bore.position.set(1.17, 0.36, 0);
    group.add(bore);
    var muzzle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 12, 24), accent);
    muzzle.rotation.y = Math.PI / 2;
    muzzle.position.set(1.15, 0.36, 0);
    group.add(muzzle);

    // Frame / dust cover (polymer, lower) — rounded
    var frame = edged(new THREE.Mesh(roundedBoxX(1.15, 0.28, 0.34, 0.045), polymer), 0x000000, 0.3, 45);
    frame.position.set(-0.2, 0.14, 0);
    group.add(frame);

    // Takedown lever + slide release
    var takedown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), brushed);
    takedown.rotation.x = Math.PI / 2;
    takedown.position.set(0.1, 0.24, 0.2);
    group.add(takedown);
    var slideRelease = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.05), brushed);
    slideRelease.position.set(-0.02, 0.28, 0.2);
    group.add(slideRelease);

    // Grip (angled polymer, rounded) with a magwell flare at the base
    var grip = edged(new THREE.Mesh(roundedBoxY(0.36, 0.92, 0.3, 0.06), polymer), 0x000000, 0.3, 45);
    grip.position.set(-0.62, -0.44, 0);
    grip.rotation.z = -0.22;
    group.add(grip);

    // Stippled grip texture — a grid of tiny raised polymer bumps instead of flat ridges
    var stippleMat = new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.9 });
    var stippleGeo = new THREE.SphereGeometry(0.017, 6, 6);
    for (var sx = 0; sx < 3; sx++) {
      for (var sy = 0; sy < 6; sy++) {
        var bump = new THREE.Mesh(stippleGeo, stippleMat);
        var lx = -0.13 + sx * 0.13;
        var ly = -0.32 + sy * 0.13 + (sx % 2 ? 0.06 : 0);
        bump.position.set(lx, ly, 0.151);
        group.add(bump);
        var bump2 = bump.clone();
        bump2.position.z = -0.151;
        group.add(bump2);
      }
    }

    // Magazine base plate
    var magBase = new THREE.Mesh(roundedBoxY(0.34, 0.09, 0.3, 0.03), darkSteel);
    magBase.position.set(-0.79, -0.93, 0);
    magBase.rotation.z = -0.22;
    group.add(magBase);

    // Trigger guard + trigger + trigger safety blade
    var guard = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.032, 12, 28, Math.PI * 1.4), polymer);
    guard.position.set(-0.18, -0.14, 0);
    guard.rotation.z = Math.PI * 0.62;
    group.add(guard);
    var trigger = new THREE.Mesh(roundedBoxX(0.055, 0.15, 0.07, 0.02), accent);
    trigger.position.set(-0.16, -0.12, 0);
    group.add(trigger);

    group.rotation.z = 0.03;
    group.scale.setScalar(1.05);
    castRecv(group);
    return group;
  }

  function makeGroundShadow(radius) {
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    var ctx = canvas.getContext("2d");
    var grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.55)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  function init() {
    var wrap = document.getElementById("studio3d-canvas-wrap");
    if (!wrap || typeof THREE === "undefined") return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0.15, 6);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if ("toneMapping" in renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.6; }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);

    // Studio (PMREM) environment reflections — this is what makes metal/glass/plastic read as real materials.
    if (THREE.PMREMGenerator && THREE.RoomEnvironment) {
      var pmrem = new THREE.PMREMGenerator(renderer);
      var envScene = new THREE.RoomEnvironment();
      scene.environment = pmrem.fromScene(envScene, 0.035).texture;
      pmrem.dispose();
    }

    // Three-point-ish light rig for believable shading + a cool rim light matching the brand accent.
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    var key = new THREE.DirectionalLight(0xffffff, 1.3);
    key.position.set(4, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3; key.shadow.camera.right = 3;
    key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
    key.shadow.camera.near = 1; key.shadow.camera.far = 15;
    key.shadow.bias = -0.0025;
    key.shadow.radius = 4;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xbcd8ff, 0.35);
    fill.position.set(-4, 2, 2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0x22d3ee, 0.6);
    rim.position.set(-2, 3, -5);
    scene.add(rim);

    var ground = makeGroundShadow(2.6);
    ground.position.y = -1.32;
    ground.receiveShadow = false; // canvas-based fake AO, not a real shadow receiver
    scene.add(ground);

    var stage = new THREE.Group();
    scene.add(stage);

    var models = {
      network: buildNetwork(),
      pistol: buildPistol(),
      rubik: buildRubik()
    };
    var order = ["network", "pistol", "rubik"];
    var initial = (window.pendingStudio3DModel && models[window.pendingStudio3DModel]) ? window.pendingStudio3DModel : "network";
    order.forEach(function (key2) {
      models[key2].visible = key2 === initial;
      stage.add(models[key2]);
    });

    window.setStudio3DModel = function (name) {
      if (!models[name]) return;
      order.forEach(function (key2) { models[key2].visible = key2 === name; });
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
      order.forEach(function (key2) {
        if (models[key2].visible && models[key2].userData.onFrame) models[key2].userData.onFrame();
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
