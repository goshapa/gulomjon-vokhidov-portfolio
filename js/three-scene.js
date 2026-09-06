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

  function buildWatch() {
    var group = new THREE.Group();
    var steel = new THREE.MeshPhysicalMaterial({ color: 0xc9cdd3, metalness: 1, roughness: 0.18, clearcoat: 0.5, clearcoatRoughness: 0.25 });
    var steelBrushed = new THREE.MeshStandardMaterial({ color: 0xaeb3ba, metalness: 0.95, roughness: 0.45 });
    var darkSteel = new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.9, roughness: 0.35 });
    var dial = new THREE.MeshPhysicalMaterial({ color: 0x0b1220, metalness: 0.3, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 });
    var accent = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e5a66, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.25 });
    var gold = new THREE.MeshStandardMaterial({ color: 0xd8b463, metalness: 0.9, roughness: 0.3 });
    var crystal = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 0.95, thickness: 0.05, clearcoat: 1, ior: 1.5, transparent: true, opacity: 0.35 });
    var leather = new THREE.MeshPhysicalMaterial({ color: 0x241a15, roughness: 0.85, clearcoat: 0.15, clearcoatRoughness: 0.6 });

    // Case (rounded cylindrical body) with a fluted bezel ring on top
    var caseBody = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.02, 0.42, 48), steel);
    group.add(castRecv(caseBody));
    var bezel = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.09, 16, 48), steelBrushed);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.y = 0.21;
    group.add(bezel);
    for (var f = 0; f < 60; f++) {
      var a = (f / 60) * Math.PI * 2;
      var flute = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.16), darkSteel);
      flute.position.set(Math.cos(a) * 1.0, 0.235, Math.sin(a) * 1.0);
      flute.rotation.y = -a;
      group.add(flute);
    }

    // Dial + crystal
    var dialMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.06, 48), dial);
    dialMesh.position.y = 0.19;
    group.add(dialMesh);
    var crystalMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 0.05, 48), crystal);
    crystalMesh.position.y = 0.24;
    group.add(crystalMesh);

    // Hour indices (12 luminous batons) + minute track dots
    var idxGeo = new THREE.BoxGeometry(0.06, 0.03, 0.16);
    for (var h = 0; h < 12; h++) {
      var ha = (h / 12) * Math.PI * 2;
      var idx = new THREE.Mesh(idxGeo, h % 3 === 0 ? gold : steelBrushed);
      idx.position.set(Math.sin(ha) * 0.68, 0.225, Math.cos(ha) * 0.68);
      idx.rotation.y = -ha;
      group.add(idx);
    }
    var dotGeo = new THREE.SphereGeometry(0.012, 8, 8);
    var dotMat = new THREE.MeshStandardMaterial({ color: 0x8a94a6, roughness: 0.6 });
    for (var m = 0; m < 60; m++) {
      if (m % 5 === 0) continue;
      var ma = (m / 60) * Math.PI * 2;
      var dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.sin(ma) * 0.79, 0.225, Math.cos(ma) * 0.79);
      group.add(dot);
    }

    // Watch hands (hour / minute / seconds) pivoting on a center post
    var pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 16), gold);
    pivot.position.y = 0.24;
    group.add(pivot);
    var hourHand = new THREE.Mesh(roundedBoxX(0.44, 0.05, 0.02, 0.02), steelBrushed);
    hourHand.position.set(0.1, 0.26, 0.12);
    hourHand.rotation.y = -0.9;
    group.add(hourHand);
    var minuteHand = new THREE.Mesh(roundedBoxX(0.64, 0.045, 0.018, 0.018), steelBrushed);
    minuteHand.position.set(-0.18, 0.27, -0.22);
    minuteHand.rotation.y = 2.1;
    group.add(minuteHand);
    var secHand = new THREE.Mesh(roundedBoxX(0.72, 0.015, 0.015, 0.007), accent);
    secHand.position.set(0.2, 0.28, -0.3);
    secHand.rotation.y = 1.15;
    group.add(secHand);
    group.userData.onFrame = function () {
      secHand.rotation.y += 0.02;
    };

    // Crown + a small chronograph pusher above/below it
    var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 20), steelBrushed);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(0, 0.02, 1.08);
    group.add(edged(crown, 0x000000, 0.3, 40));
    var pusherTop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 14), darkSteel);
    pusherTop.rotation.z = Math.PI / 2;
    pusherTop.position.set(0, 0.28, 0.98);
    group.add(pusherTop);
    var pusherBottom = pusherTop.clone();
    pusherBottom.position.y = -0.24;
    group.add(pusherBottom);

    // Lugs connecting the case to the strap
    var lugMat = steel;
    [[0.62, 1], [0.62, -1]].forEach(function (pair) {
      [1, -1].forEach(function (side) {
        var lug = new THREE.Mesh(roundedBoxX(0.42, 0.16, 0.5, 0.05), lugMat);
        lug.position.set(pair[1] * (pair[0]), -0.12, side * 0.92);
        lug.rotation.z = pair[1] * 0.55;
        group.add(castRecv(lug));
      });
    });

    // Leather strap — two tapered bands curving away from the case, plus a buckle
    function strapBand(dir) {
      var band = new THREE.Group();
      var segs = 6, segLen = 0.36;
      var x = dir * 1.0, y = -0.16, angle = 0;
      for (var i = 0; i < segs; i++) {
        var t = i / (segs - 1);
        var w = 0.72 - t * 0.28;
        var stepAngle = 0.14 + t * 0.24;
        var dx = dir * Math.cos(angle) * segLen;
        var dy = -Math.sin(angle) * segLen;
        var nx = x + dx, ny = y + dy;
        var seg = new THREE.Mesh(roundedBoxX(segLen * 1.05, 0.06, w, 0.05), leather);
        seg.position.set((x + nx) / 2, (y + ny) / 2, 0);
        seg.rotation.z = Math.atan2(dy, dx);
        band.add(castRecv(seg));
        x = nx; y = ny;
        angle += stepAngle;
      }
      band.userData.end = { x: x, y: y };
      return band;
    }
    group.add(strapBand(1));
    var tailBand = strapBand(-1);
    group.add(tailBand);
    var buckle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 24), steelBrushed);
    buckle.position.set(tailBand.userData.end.x + 0.1, tailBand.userData.end.y, 0);
    buckle.rotation.y = Math.PI / 2;
    group.add(buckle);

    group.rotation.x = -0.25;
    group.rotation.z = 0.08;
    group.scale.setScalar(0.85);
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
      watch: buildWatch(),
      rubik: buildRubik()
    };
    var order = ["network", "watch", "rubik"];
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
