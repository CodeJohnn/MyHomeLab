    const errorBox = document.getElementById('error'); function fail(e) { errorBox.style.display = 'block'; errorBox.textContent = 'Falha ao iniciar o cenário 3D: ' + (e?.message || e) + '\nAbra com Live Server e confira a conexão com a internet.'; console.error(e) } window.addEventListener('error', e => fail(e.error || e.message)); window.addEventListener('unhandledrejection', e => fail(e.reason));
    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
      const { RoundedBoxGeometry } = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/geometries/RoundedBoxGeometry.js');
      const { CSS3DRenderer, CSS3DObject } = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/renderers/CSS3DRenderer.js');
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#101923'); const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 100); const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2.5)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.4; document.body.prepend(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xe3f4ff, 0x6c554b, 2.3)); const sun = new THREE.DirectionalLight(0xfff3dc, 3.3); sun.position.set(-4, 11, 7); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(sun);
      const M = (c, metalness = 0, roughness = .72) => new THREE.MeshStandardMaterial({ color: c, metalness, roughness }); const wood = M('#a97b58'), woodLight = M('#c49b75'), black = M('#151d25', .2, .42), metal = M('#39434b', .65, .35), wall = M('#a5adb4'), tile = M('#98765c'), white = M('#dce5e7'), blue = M('#2daaff'), glass = new THREE.MeshPhysicalMaterial({ color: '#294b62', metalness: .12, roughness: .14, transparent: true, opacity: .7 }); const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
      function box(g, w, h, d, m, x = 0, y = 0, z = 0, r = 0) { const geo = r ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)) : new THREE.BoxGeometry(w, h, d); const a = new THREE.Mesh(geo, m); a.position.set(x, y, z); a.castShadow = true; a.receiveShadow = true; g.add(a); return a } function cyl(g, r, h, m, x, y, z, segments = 24) { const a = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), m); a.position.set(x, y, z); a.castShadow = true; g.add(a); return a } function sphere(g, r, m, x, y, z) { const a = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m); a.position.set(x, y, z); a.castShadow = true; g.add(a); return a }
      let keyboardLegendTexture, redragonBadgeTexture;
      const keyboardRgbMaterials = [];
      function createKeyboard(parent, width, depth, centerY, centerZ = 0) {
        const unit = width / 15, rowDepth = depth / 6, baseTop = centerY + .022;
        const caseMat = M('#111820', .28, .38), plateMat = M('#26333c', .5, .42);
        box(parent, width, .044, depth, caseMat, 0, centerY, centerZ, .012);
        box(parent, width - .022, .006, depth - .022, plateMat, 0, centerY + .024, centerZ, .004);
        for (let led = 0; led < 24; led++) {
          const material = glow('#ff1744');
          box(parent, width / 24 - .002, .008, .003, material, -width / 2 + width * (led + .5) / 24, centerY - .004, centerZ + depth / 2 + .001, .001);
          keyboardRgbMaterials.push({ material, phase: led / 24 });
        }
        if (!redragonBadgeTexture) {
          const canvas = document.createElement('canvas');
          canvas.width = 512; canvas.height = 96;
          const context = canvas.getContext('2d');
          if (context) {
            context.fillStyle = '#101820';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#e31b3d';
            context.beginPath();
            context.arc(46, 48, 30, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#ffffff';
            context.font = 'bold 50px Arial, sans-serif';
            context.textBaseline = 'middle';
            context.fillText('REDRAGON', 91, 49);
            redragonBadgeTexture = new THREE.CanvasTexture(canvas);
            redragonBadgeTexture.colorSpace = THREE.SRGBColorSpace;
          }
        }
        if (redragonBadgeTexture) {
          const badge = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(width * .52, .38), .028), new THREE.MeshBasicMaterial({ map: redragonBadgeTexture, toneMapped: false }));
          badge.position.set(0, centerY, centerZ + depth / 2 + .003);
          parent.add(badge);
        }
        const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789FESCTRLALTENTERSHIFTBACKSPACETABDELINSHOMEENDPGUPPGDN';
        if (!keyboardLegendTexture) {
          const cols = 16, rows = 8, cell = 64, canvas = document.createElement('canvas');
          canvas.width = cols * cell; canvas.height = rows * cell;
          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = '#d6e0e7';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.font = 'bold 29px Arial, sans-serif';
            [...glyphs].forEach((character, index) => context.fillText(character, (index % cols + .5) * cell, (Math.floor(index / cols) + .5) * cell));
            keyboardLegendTexture = new THREE.CanvasTexture(canvas);
            keyboardLegendTexture.colorSpace = THREE.SRGBColorSpace;
          }
        }
        const legends = new Map([...glyphs].map((character, index) => [character, index]));
        function key(label, column, row, span = 1) {
          const keyWidth = unit * span - .004, keyDepth = rowDepth - .005;
          const x = -width / 2 + unit * (column + span / 2), z = centerZ + depth / 2 - rowDepth * (row + .5);
          const material = new THREE.MeshStandardMaterial({
            color: label === 'SPACE' ? '#25323b' : '#303b45',
            metalness: .18,
            roughness: .48,
            emissive: new THREE.Color(0x000000),
            emissiveIntensity: .85
          });
          box(parent, keyWidth, .018, keyDepth, material, x, baseTop + .009, z, .004);
          keyboardRgbMaterials.push({ material, phase: (column / 15 + row / 6) % 1 });
          if (!keyboardLegendTexture) return;
          const index = legends.get(label[0]);
          if (index === undefined) return;
          const cols = 16, rows = 8, col = index % cols, atlasRow = Math.floor(index / cols);
          const geometry = new THREE.PlaneGeometry(Math.min(keyWidth * .55, .018), Math.min(keyDepth * .42, .012));
          const uv = geometry.attributes.uv;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, (col + uv.getX(i)) / cols, 1 - (atlasRow + 1 - uv.getY(i)) / rows);
          const legend = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: keyboardLegendTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
          legend.rotation.x = -Math.PI / 2;
          legend.position.set(x, baseTop + .0185, z);
          parent.add(legend);
        }
        const rows = [
          [['ESC', 0], ['F', 2], ['F', 3], ['F', 4], ['F', 5], ['F', 7], ['F', 8], ['F', 9], ['F', 10], ['F', 12], ['F', 13]],
          [['1', 0], ['2', 1], ['3', 2], ['4', 3], ['5', 4], ['6', 5], ['7', 6], ['8', 7], ['9', 8], ['0', 9], ['-', 10], ['=', 11], ['BACKSPACE', 12, 3]],
          [['Q', 0], ['W', 1], ['E', 2], ['R', 3], ['T', 4], ['Y', 5], ['U', 6], ['I', 7], ['O', 8], ['P', 9], ['[', 10], [']', 11], ['ENTER', 12, 3]],
          [['CAPS', 0, 2], ['A', 2], ['S', 3], ['D', 4], ['F', 5], ['G', 6], ['H', 7], ['J', 8], ['K', 9], ['L', 10], [';', 11], ['SHIFT', 12, 3]],
          [['CTRL', 0, 2], ['ALT', 2], ['Z', 3], ['X', 4], ['C', 5], ['V', 6], ['B', 7], ['N', 8], ['M', 9], [',', 10], ['.', 11], ['SHIFT', 12, 3]],
          [['CTRL', 0, 2], ['ALT', 2], ['SPACE', 4, 6], ['ALT', 10], ['CTRL', 12, 3]]
        ];
        rows.forEach((row, rowIndex) => row.forEach(([label, column, span = 1]) => key(label, column, rowIndex, span)));
      }
      box(scene, 9, .24, 7, tile, 0, -.13, 0);
      const grout = M('#775b48');
      for (let x = -4.5; x <= 4.5; x += .75) box(scene, .012, .008, 7, grout, x, -.004, 0);
      for (let z = -3.5; z <= 3.5; z += .75) box(scene, 9, .008, .012, grout, 0, -.004, z);
      const roomWalls = {};
      function roomWall(side, width, depth, x, z, nx, nz) {
        const group = new THREE.Group();
        scene.add(group);
        const mesh = box(group, width, 3.3, depth, wall.clone(), x, 1.65, z);
        box(group, width + .04, .1, depth + .04, white, x, 3.3, z);
        roomWalls[side] = { group, mesh, nx, nz };
        return mesh;
      }
      const backWall = roomWall('back', 9, .14, 0, -3.5, 0, -1);
      const leftWall = roomWall('left', .14, 7, -4.5, 0, -1, 0);
      const frontWall = roomWall('front', 9, .14, 0, 3.5, 0, 1);
      const rightWall = roomWall('right', .14, 7, 4.5, 0, 1, 0);
      function isSceneVisible(object) {
        for (let node = object; node; node = node.parent) if (!node.visible) return false;
        return true;
      }

      const objects = [], byId = {}; function item(id, label, kind, x, y, z, desc) { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.id = id; scene.add(g); const o = { id, label, kind, g, desc, baseY: y, initial: [x, y, z, 0] }; objects.push(o); byId[id] = o; return g }
      // Mesa principal: estrutura completa, mas independente dos equipamentos.
      let g = item('mesa', 'Mesa principal', 'floor', 0, 0, -2.65, 'Bancada principal de trabalho.'); box(g, 4.75, .15, 1.25, woodLight, 0, 1.04, 0, .055); for (let x of [-2.16, 2.16]) for (let z of [-.49, .49]) box(g, .085, .99, .085, metal, x, .51, z, .015); box(g, 4.4, .05, .12, metal, 0, .56, -.46, .018);
      const screenMeshes = {}; function makeMonitor(id, label, x, z, w) { const g = item(id, label, 'desk', x, 1.11, z, 'Monitor do setup gamer.'); cyl(g, .19, .035, black, 0, .03, .06); cyl(g, .028, .4, metal, 0, .25, 0); box(g, w, .76, .10, black, 0, .63, 0, .04); box(g, w - .08, .68, .018, glow('#17394a'), 0, .64, .059, .015); const display = box(g, w - .13, .59, .008, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 0, .65, .079); display.userData.isScreen = true; screenMeshes[id] = display; box(g, .09, .02, .015, white, 0, .275, .058, .008) } makeMonitor('monitor1', 'Monitor esquerdo', -.85, -2.75, 1.28); makeMonitor('monitor2', 'Monitor ultrawide', .73, -2.75, 1.85);
      g = item('pc', 'PC tradicional • RTX 3060 + Water Cooler', 'floor', -1.94, 0, -2.65, 'Gabinete tradicional preto com lateral de vidro temperado, RTX 3060 12 GB, Ryzen 7 5700X3D, water cooler 240 mm e RAM RGB.');
      // Gabinete gamer tradicional: frente mesh preta, painel traseiro metálico e vidro temperado SOMENTE na lateral direita.
      const pc = g, chassis = M('#10151d', .55, .32), pcb = M('#172b27', .12, .85), silver = M('#8898a5', .75, .27), gpuMat = M('#242b35', .45, .35), cyan = glow('#22cfff'), ice = glow('#a7f6ff');
      box(pc, .86, .075, .94, chassis, 0, .055, 0, .015); box(pc, .86, .07, .94, chassis, 0, 1.20, 0, .015);
      for (const x of [-.405, .405]) for (const z of [-.445, .445]) box(pc, .025, 1.16, .025, chassis, x, .62, z, .007);
      box(pc, .035, 1.10, .89, chassis, -.405, .62, 0, .01); // painel traseiro metálico
      // Placa-mãe, trilhas, dissipadores e soquete
      box(pc, .045, .76, .65, pcb, -.355, .68, -.06, .012);
      for (let i = 0; i < 7; i++)box(pc, .005, .012, .35, i % 2 ? silver : cyan, -.328, .38 + i * .095, -.06);
      box(pc, .065, .18, .19, silver, -.307, .77, -.13, .012);
      box(pc, .065, .12, .2, gpuMat, -.309, .41, -.16, .012);
      // Memórias RGB, verticais e individuais
      for (let i = 0; i < 2; i++) { box(pc, .045, .39, .048, black, -.29, .73, .105 + i * .075, .008); box(pc, .049, .34, .018, i ? cyan : ice, -.258, .73, .105 + i * .075, .006) }
      // RTX 3060 na horizontal, instalada no slot PCIe da placa-mãe.
      // Eixo longo Z, placa deitada no plano XZ, ventoinhas na face inferior.
      const gpuHorizontal = new THREE.Group(); pc.add(gpuHorizontal);
      const gpuVertical = gpuHorizontal; // alias mantido para compatibilidade com os detalhes existentes
      box(gpuVertical, .50, .11, .68, gpuMat, .035, .48, -.055, .026); // corpo da GPU
      box(gpuVertical, .48, .018, .65, pcb, .035, .545, -.055, .012); // backplate superior
      box(gpuVertical, .49, .025, .66, silver, .035, .42, -.055, .012); // dissipador inferior
      box(gpuVertical, .045, .065, .68, chassis, -.24, .48, -.055, .008); // encaixe PCIe
      box(gpuVertical, .038, .075, .68, cyan, .292, .49, -.055, .009); // lateral RGB
      box(gpuVertical, .50, .035, .04, silver, .035, .47, -.41, .008); // suporte traseiro
      const animatedPcFans = [];
      function pcFan(parent, x, y, z, r, axis = 'z') {
        const mount = new THREE.Group(); mount.position.set(x, y, z); parent.add(mount);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .014, 8, 36), cyan); if (axis === 'x') ring.rotation.y = Math.PI / 2; mount.add(ring);
        const rotor = new THREE.Group(); if (axis === 'x') rotor.rotation.y = Math.PI / 2; mount.add(rotor);
        for (let k = 0; k < 7; k++) { const blade = box(rotor, r * .70, r * .28, .018, M('#d6eaf0', .3, .34), r * .38, 0, 0, .008); blade.rotation.z = .5; const pivot = new THREE.Group(); pivot.rotation.z = k * Math.PI * 2 / 7; rotor.remove(blade); pivot.add(blade); rotor.add(pivot) }
        const hub = sphere(rotor, r * .18, silver, 0, 0, 0); animatedPcFans.push(rotor);
      }
      // Duas ventoinhas na face inferior, voltadas para o piso do gabinete.
      for (const z of [-.23, .13]) { const fan = new THREE.Group(); fan.position.set(.04, .405, z); fan.rotation.x = Math.PI / 2; gpuVertical.add(fan); pcFan(fan, 0, 0, 0, .135); }
      // Radiador de 240 mm no teto e duas ventoinhas superiores.
      box(pc, .67, .105, .38, gpuMat, 0, 1.095, -.15, .018);
      for (let i = 0; i < 12; i++)box(pc, .63, .004, .012, silver, 0, 1.04, -.30 + i * .026);
      for (const x of [-.18, .18]) pcFan(pc, x, 1.025, -.14, .14);
      // Bomba de water cooler com visor digital e mangueiras curvas.
      const pump = box(pc, .105, .20, .20, chassis, -.24, .83, -.11, .035);
      box(pc, .012, .13, .13, cyan, -.175, .83, -.11, .015);
      function tube(points) { const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))); const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, .018, 8, false), M('#1b222c', .28, .38)); pc.add(mesh) }
      tube([[-.22, .89, -.06], [-.04, 1.00, -.02], [.20, 1.10, -.05], [.21, 1.09, -.16]]);
      tube([[-.22, .76, -.07], [-.06, .96, .07], [.12, 1.10, .05], [.17, 1.09, -.17]]);
      // Três fans frontais atrás da grade mesh, com iluminação azul discreta.
      for (const y of [.28, .60, .92]) pcFan(pc, .23, y, .39, .13);
      // Faixas RGB e painéis de vidro com transparência real.
      box(pc, .014, 1.08, .014, cyan, .388, .62, .42, .004);
      box(pc, .014, 1.08, .014, cyan, -.388, .62, .42, .004);
      const temperedGlass = new THREE.MeshPhysicalMaterial({ color: '#b7e5f3', metalness: 0, roughness: .06, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide, clearcoat: 1, clearcoatRoughness: .05 });
      box(pc, .012, 1.08, .83, temperedGlass, .408, .62, 0, .003); // lateral direita de vidro temperado
      // Frente convencional de metal perfurado, sem vidro panorâmico.
      const frontMesh = M('#111820', .62, .49);
      box(pc, .79, 1.08, .027, frontMesh, 0, .62, .453, .018);
      // Grade com fileiras de perfurações e estrutura reforçada.
      const meshHole = M('#2c3944', .35, .65);
      for (let row = 0; row < 22; row++)for (let col = 0; col < 13; col++) {
        const x = -.345 + col * .057, y = .14 + row * .045;
        box(pc, .020, .013, .004, meshHole, x, y, .471, .002);
      }
      for (const x of [-.39, .39]) box(pc, .035, 1.11, .045, chassis, x, .62, .467, .008);
      for (const y of [.065, 1.18]) box(pc, .80, .032, .045, chassis, 0, y, .467, .008);
      // Tampa superior metálica com saídas de ar.
      box(pc, .80, .025, .87, chassis, 0, 1.255, 0, .012);
      for (let i = 0; i < 15; i++)box(pc, .60, .003, .008, metal, 0, 1.271, -.34 + i * .047, .001);
      box(pc, .15, .025, .12, chassis, .27, 1.22, .29, .007);
      const pcLight = new THREE.PointLight(0x24baff, 1.0, 1.6); pcLight.position.set(.12, .75, .12); pc.add(pcLight);

      // V3: acabamento do gabinete tradicional — componentes agrupados no mesmo objeto selecionável.
      const copper = M('#c87c46', .45, .55), gold = M('#d8af65', .4, .65), rubber = M('#151b22', .9, .05), pcWhite = glow('#bceeff');
      // Pés emborrachados, molduras e rebites do vidro.
      for (const x of [-.32, .32]) for (const z of [-.35, .35]) box(pc, .14, .055, .15, rubber, x, -.013, z, .014);
      for (const y of [.12, 1.13]) for (const x of [-.37, .37]) sphere(pc, .013, silver, x, y, .457);
      // PCB com chips, capacitores e trilhas impressas.
      for (let i = 0; i < 22; i++) {
        const y = .34 + (i % 11) * .068, z = -.33 + Math.floor(i / 11) * .13;
        box(pc, .013, .026, .032, i % 3 === 0 ? gold : rubber, -.321, y, z, .004);
      }
      for (let i = 0; i < 9; i++)box(pc, .008, .006, .18, i % 2 ? gold : copper, -.32, .39 + i * .068, -.14 + i * .012, .002);
      // Dissipadores de VRM com aletas metálicas.
      for (let i = 0; i < 9; i++)box(pc, .085, .013, .11, silver, -.24, .98 - i * .024, -.31, .003);
      // RAM: etiquetas, contatos dourados e difusores de luz.
      for (const z of [.105, .18]) {
        for (let i = 0; i < 8; i++)box(pc, .006, .008, .012, gold, -.23, .55 + i * .034, z, .002);
        box(pc, .012, .31, .014, pcWhite, -.226, .74, z, .003);
      }
      // Detalhes da GPU horizontal: aletas, conectores e logotipo lateral.
      for (let i = 0; i < 14; i++)box(gpuVertical, .38, .008, .007, silver, .035, .426, -.34 + i * .044, .002);
      for (let i = 0; i < 3; i++)box(gpuVertical, .035, .028, .035, black, .11 + i * .05, .56, -.20, .004);
      box(gpuVertical, .012, .07, .22, pcWhite, .313, .50, -.055, .004);
      // Identificação RTX 3060 visível pela lateral de vidro temperado.
      // A placa permanece horizontal: o texto fica na borda, não sobre as ventoinhas.
      const gpuLabelCanvas = document.createElement('canvas'); gpuLabelCanvas.width = 1024; gpuLabelCanvas.height = 256;
      const gpuCtx = gpuLabelCanvas.getContext('2d');
      gpuCtx.fillStyle = '#111a22'; gpuCtx.fillRect(0, 0, 1024, 256);
      gpuCtx.fillStyle = '#76e143'; gpuCtx.fillRect(18, 18, 12, 220);
      gpuCtx.font = 'bold 112px Arial, sans-serif'; gpuCtx.fillStyle = '#f0f5f7'; gpuCtx.fillText('RTX 3060', 58, 159);
      gpuCtx.font = 'bold 34px Arial, sans-serif'; gpuCtx.fillStyle = '#89a2b1'; gpuCtx.fillText('GEFORCE  •  12 GB', 62, 215);
      const gpuLabelTex = new THREE.CanvasTexture(gpuLabelCanvas); gpuLabelTex.colorSpace = THREE.SRGBColorSpace;
      const gpuLabel = new THREE.Mesh(new THREE.PlaneGeometry(.64, .14), new THREE.MeshBasicMaterial({ map: gpuLabelTex, side: THREE.DoubleSide, transparent: false, toneMapped: false }));
      gpuLabel.position.set(.317, .50, -.055); gpuLabel.rotation.y = Math.PI / 2; gpuVertical.add(gpuLabel);
      // Conector de energia e suporte na extremidade da placa.
      box(gpuVertical, .08, .055, .09, black, .20, .555, .18, .008);
      for (let i = 0; i < 6; i++)box(gpuVertical, .009, .012, .012, silver, .171 + i * .011, .588, .18, .002);
      // Cabos de energia com curvatura individual.
      function pcCable(points, material = black, r = .009) { const c = new THREE.CatmullRomCurve3(points.map(q => new THREE.Vector3(...q))); const mesh = new THREE.Mesh(new THREE.TubeGeometry(c, 24, r, 6, false), material); pc.add(mesh) }
      for (let i = 0; i < 5; i++)pcCable([[.32, .11, -.3], [.31, .27, -.25 + i * .018], [.23, .4, -.13 + i * .018], [.2, .59, -.05 + i * .012]], i % 2 ? rubber : metal, .006);
      for (let i = 0; i < 4; i++)pcCable([[-.34, .18, -.29], [-.23, .21, -.29], [.06, .27, -.27], [.26, .40, -.23]], rubber, .007);
      // SSD M.2 e parafuso de fixação.
      box(pc, .018, .075, .29, pcb, -.295, .32, -.12, .004);
      sphere(pc, .009, gold, -.281, .32, .01);
      // Fonte sob a cobertura e grade de ventilação.
      box(pc, .52, .18, .34, rubber, .04, .18, -.23, .02);
      for (let i = 0; i < 8; i++)box(pc, .4, .008, .009, silver, .04, .28, -.37 + i * .035, .002);
      // Parafusos e aletas do radiador superior.
      for (const x of [-.28, .28]) for (const z of [-.3, .02]) sphere(pc, .011, silver, x, 1.14, z);
      for (let i = 0; i < 16; i++)box(pc, .008, .055, .33, metal, -.3 + i * .04, 1.10, -.15, .001);
      // Moldura da frente mesh, porta USB e botão power.
      for (const y of [.07, 1.17]) box(pc, .79, .015, .015, chassis, 0, y, .448, .003);
      box(pc, .04, .014, .024, silver, .21, 1.246, .30, .003);
      sphere(pc, .018, cyan, .34, 1.248, .31);
      // LEDs pontuais no interior, discretos.
      for (const z of [-.36, .36]) for (let i = 0; i < 6; i++)sphere(pc, .008, cyan, .38, .19 + i * .16, z);

      g = item('cadeira', 'Cadeira ergonômica', 'floor', -.15, 0, -1.62, 'Cadeira ergonômica do setup. Aproxime-se e pressione E para sentar.');
      g.rotation.y = Math.PI;
      objects[objects.length - 1].initial[0] = -.15;
      objects[objects.length - 1].initial[2] = -1.62;
      objects[objects.length - 1].initial[3] = Math.PI;
      cyl(g, .055, .55, metal, 0, .38, 0);
      for (let a = 0; a < 5; a++) { const arm = box(g, .08, .055, .44, metal, 0, .13, .13); arm.rotation.y = a * Math.PI * 2 / 5 }
      box(g, .65, .16, .61, black, 0, .76, 0, .07);
      box(g, .67, .95, .14, black, 0, 1.22, -.28, .07);
      box(g, .53, .22, .15, M('#273a45'), 0, 1.52, -.29, .06);
      for (let x of [-.38, .38]) { box(g, .09, .33, .09, metal, x, .99, 0, .02); box(g, .12, .05, .39, black, x, 1.13, .02, .02) }
      g = item('estante', 'Estante de livros de programação', 'floor', 3.55, 0, .9, 'Estante de madeira com livros sobre programação e tecnologia em todas as prateleiras.');
      const shelfWood = M('#956b4c'), shelfEdge = M('#bd936b');
      for (const x of [-.65, .65]) box(g, .09, 3.36, .68, shelfWood, x, 1.68, 0, .018);
      box(g, 1.22, 3.25, .045, shelfWood, 0, 1.68, -.31, .012);
      const shelfLevels = [.38, 1.16, 1.96, 2.78];
      box(g, 1.31, .12, .7, shelfWood, 0, .12, 0, .025);
      for (const y of shelfLevels) {
        box(g, 1.31, .1, .7, wood, 0, y, 0, .025);
        box(g, 1.28, .035, .045, shelfEdge, 0, y, .36, .008);
      }
      box(g, 1.4, .14, .74, shelfWood, 0, 3.35, 0, .025);
      const bookColors = ['#663d32', '#31546a', '#657249', '#813f46', '#b07c46', '#4b405e', '#3f6861', '#9c654e', '#394b70', '#786544', '#7b4b66', '#526b78'];
      const bookTitles = ['PYTHON', 'JAVASCRIPT', 'HTML', 'CSS', 'C++', 'JAVA', 'SQL', 'GIT', 'LINUX', 'ALGORITHMS', 'REACT', 'NODE.JS', 'TYPESCRIPT', 'API DESIGN', 'C#', 'PHP'];
      const pageMaterial = M('#d7cdb5', 0, .88);
      function book(x, shelfY, height, width, depth, color, title) {
        const cover = M(color, .04, .72);
        const volume = new THREE.Group();
        volume.position.set(x, shelfY + .052 + height / 2, .035);
        g.add(volume);
        box(volume, width * .86, height * .94, depth * .84, pageMaterial, 0, 0, 0, .004);
        box(volume, .012, height, depth, cover, -width / 2, 0, 0, .004);
        box(volume, .012, height, depth, cover, width / 2, 0, 0, .004);
        box(volume, width, height, .012, cover, 0, 0, depth / 2, .004);
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128;
        labelCanvas.height = 512;
        const labelContext = labelCanvas.getContext('2d');
        if (labelContext) {
          labelContext.fillStyle = color;
          labelContext.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
          labelContext.fillStyle = 'rgba(255,255,255,.2)';
          labelContext.fillRect(12, 0, 5, labelCanvas.height);
          labelContext.fillStyle = 'rgba(13,22,29,.86)';
          labelContext.fillRect(0, 135, labelCanvas.width, 242);
          labelContext.save();
          labelContext.translate(labelCanvas.width / 2, labelCanvas.height / 2);
          labelContext.rotate(-Math.PI / 2);
          labelContext.fillStyle = '#9bffc7';
          labelContext.textAlign = 'center';
          labelContext.textBaseline = 'middle';
          labelContext.font = `bold ${Math.min(88, Math.floor(430 / title.length))}px Arial, sans-serif`;
          labelContext.fillText(title, 0, -25, labelCanvas.height - 20);
          labelContext.fillStyle = '#f3e8d2';
          labelContext.font = 'bold 64px Arial, sans-serif';
          labelContext.fillText('</>', 0, 75, labelCanvas.height - 24);
          labelContext.restore();
        }
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.colorSpace = THREE.SRGBColorSpace;
        const spineLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(width * .99, height * .99),
          new THREE.MeshBasicMaterial({ map: labelTexture, toneMapped: false })
        );
        spineLabel.position.set(0, 0, depth / 2 + .015);
        volume.add(spineLabel);
      }
      let bookIndex = 0;
      for (let shelfIndex = 0; shelfIndex < shelfLevels.length; shelfIndex++) {
        let bookX = -.58;
        const topShelf = shelfIndex === shelfLevels.length - 1;
        while (bookX < .57) {
          const width = .092 + (bookIndex % 4) * .008;
          const maxWidth = .58 - bookX;
          const actualWidth = Math.min(width, maxWidth);
          const height = topShelf
            ? .31 + ((bookIndex * 7) % 9) * .012
            : .43 + ((bookIndex * 7) % 13) * .012;
          book(
            bookX + actualWidth / 2,
            shelfLevels[shelfIndex],
            height,
            actualWidth,
            .2 + (bookIndex % 3) * .018,
            bookColors[bookIndex % bookColors.length],
            bookTitles[bookIndex % bookTitles.length]
          );
          bookX += actualWidth + .006;
          bookIndex++;
        }
      }
      g = item('servidor', 'Servidor OptiPlex', 'floor', -2.7, 0, 1.4, 'Servidor Home Lab com Ubuntu, Samba, Docker, CasaOS e Jellyfin.'); box(g, .39, .72, .8, black, 0, .36, 0, .04); box(g, .35, .65, .02, metal, 0, .36, .41, .01); box(g, .09, .09, .025, glow('#67ffa9'), 0, .57, .435, .008); for (let i = 0; i < 5; i++)box(g, .25, .018, .026, M('#606b73'), 0, .17 + i * .065, .44, .005);
      g = item('bancada', 'Bancada de manutenção', 'floor', -3.15, 0, .8, 'Mesa de manutenção e montagem de computadores.'); box(g, 2.3, .13, .95, woodLight, 0, 1.03, 0, .04); for (let x of [-1, 1]) for (let z of [-.36, .36]) box(g, .075, 1, .075, metal, x, .5, z, .015);
      g = item('tv', 'Pegboard • acessórios', 'wallBack', -1.3, 1.9, -3.34, 'Pegboard com action figures, teclado extra e suporte para controle de videogame.');
      const pegboard = M('#b7a17b'), pegHole = M('#594b39'), figureRed = M('#b64248'), figureBlue = M('#3681a0'), figureGold = M('#d5a74e'), controllerMat = M('#242b35', .15, .55);
      box(g, 1.3, 1.55, .07, black, 0, 0, 0, .025);
      box(g, 1.22, 1.47, .018, pegboard, 0, 0, .045, .012);
      const holeGeometry = new THREE.CylinderGeometry(.012, .012, .009, 10);
      for (let x = -4; x <= 4; x++) for (let y = -5; y <= 5; y++) {
        const hole = new THREE.Mesh(holeGeometry, pegHole);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(x * .125, y * .125, .059);
        g.add(hole);
      }
      for (const x of [-.57, .57]) box(g, .035, 1.48, .035, metal, x, 0, .07, .006);
      function actionFigure(x, suit, accent) {
        const figure = new THREE.Group();
        figure.position.set(x, .29, .13);
        g.add(figure);
        box(figure, .105, .13, .055, suit, 0, .015, 0, .018);
        sphere(figure, .052, accent, 0, .12, 0);
        for (const side of [-1, 1]) {
          const arm = box(figure, .035, .14, .04, suit, side * .078, .025, 0, .012);
          arm.rotation.z = side * -.16;
          box(figure, .045, .13, .045, black, side * .03, -.115, 0, .012);
        }
        box(figure, .035, .025, .04, accent, 0, .015, .034, .004);
      }
      actionFigure(-.39, figureRed, figureGold);
      actionFigure(-.13, figureBlue, white);
      // Suporte suspenso e controle de videogame.
      box(g, .035, .16, .13, metal, .31, -.18, .13, .008);
      box(g, .035, .16, .13, metal, .53, -.18, .13, .008);
      box(g, .3, .035, .14, metal, .42, -.245, .17, .01);
      const controller = new THREE.Group();
      controller.position.set(.42, -.055, .17);
      g.add(controller);
      const controllerBody = box(controller, .32, .105, .055, controllerMat, 0, 0, 0, .035);
      controllerBody.rotation.z = -.04;
      for (const side of [-1, 1]) {
        const grip = box(controller, .105, .13, .06, controllerMat, side * .115, -.035, 0, .035);
        grip.rotation.z = side * -.18;
      }
      box(controller, .075, .018, .012, black, -.085, .015, .034, .006);
      for (let i = 0; i < 4; i++) sphere(controller, .012, i % 2 ? figureBlue : figureRed, .07 + (i % 2) * .025, .012 + Math.floor(i / 2) * .025, .036);
      sphere(controller, .018, black, -.075, -.025, .036);
      sphere(controller, .018, black, .025, -.025, .036);
      // Teclado extra preso em dois ganchos na parte inferior.
      for (const x of [-.37, .37]) box(g, .025, .13, .13, metal, x, -.36, .12, .008);
      box(g, .82, .22, .075, black, 0, -.46, .14, .018);
      const pegboardKey = M('#59636b'), pegboardAccentKey = M('#4bc2ed');
      for (let row = 0; row < 3; row++) for (let col = 0; col < 13; col++) {
        const keyWidth = col === 6 && row === 2 ? .18 : .043;
        if (row === 2 && col >= 5 && col <= 8 && col !== 6) continue;
        const keyX = col === 6 && row === 2 ? 0 : -.35 + col * .057;
        box(g, keyWidth, .035, .012, (row + col) % 4 === 0 ? pegboardAccentKey : pegboardKey, keyX, -.415 - row * .052, .184, .004);
      }
      // Bancada de eletr?nica em L, com ferramentas integradas ao m?vel.
      g = item('mesaL', 'Mesa em L com esta??o de solda', 'floor', 3.1, 0, -2.2, 'Bancada em L: esta??o de solda, suporte para ferro, carretel de estanho e placa em manuten??o.');
      box(g, 2.2, .12, .72, woodLight, 0, 1.01, 0, .025);
      box(g, .72, .12, 1.28, woodLight, .74, 1.01, 1, .025);
      for (const [x,z] of [[-.95,-.24],[.95,-.24],[-.95,.24],[.95,1.5],[.5,1.5]]) box(g, .065, .95, .065, metal, x, .475, z, .008);
      const solderBlue = M('#225c89'), solderGreen = M('#176448'), solderSilver = M('#c2c9cf', .8, .3);
      box(g, .78, .012, .5, solderBlue, -.15, 1.078, .02, .008);
      box(g, .38, .22, .3, black, -.68, 1.18, -.03, .025);
      box(g, .19, .065, .012, glow('#5ee8cd'), -.72, 1.22, .128, .003);
      cyl(g, .035, .025, solderSilver, -.58, 1.3, .02);
      box(g, .2, .025, .28, metal, .55, 1.095, .03, .008);
      const iron = box(g, .035, .035, .28, black, .55, 1.19, .04, .01); iron.rotation.x = -.4;
      box(g, .012, .012, .12, solderSilver, .55, 1.13, .22, .002);
      const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(-.5,1.12,.1),new THREE.Vector3(-.3,1.09,.27),new THREE.Vector3(.25,1.09,.25),new THREE.Vector3(.55,1.19,-.1)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 16, .009, 5, false), black));
      box(g, .3, .016, .23, solderGreen, -.12, 1.095, .02, .003);
      for (let i=0;i<5;i++) box(g, .025, .025, .075, solderSilver, -.23+i*.05, 1.115, .02, .002);
      cyl(g, .075, .07, solderSilver, .73, 1.115, .85);
      cyl(g, .035, .08, black, .73, 1.12, .85);
      box(g, .22, .035, .12, solderBlue, .72, 1.1, 1.2, .008);
      // Rack independente do servidor j? existente.
      g = item('rackServidor', 'Rack de servidores', 'floor', 3.78, 0, 2.6, 'Rack com tr?s servidores, portas de rede e indicadores de atividade.');
      box(g, .7, 1.35, .68, metal, 0, .72, 0, .025);
      for (let row=0;row<3;row++) {
        const y=.35+row*.33;
        box(g, .59, .25, .025, black, 0, y, .354, .01);
        for (let i=0;i<7;i++) box(g, .025, .13, .01, metal, -.23+i*.045, y, .373, .002);
        sphere(g, .014, glow('#58f5a1'), .24, y+.055, .375);
        sphere(g, .01, glow('#62bfff'), .24, y-.02, .375);
      }
      for (const x of [-.25,.25]) for (const z of [-.23,.23]) cyl(g,.045,.08,black,x,.055,z);
      // Lousa com anota??es desenhadas em alta resolu??o.
      g = item('lousa', 'Lousa branca de anota??es', 'wallBack', -2.95, 2.4, -3.35, 'Planejamento do laborat?rio: rede, servidores, backups e manuten??o eletr?nica.');
      box(g, 1.75, 1.03, .065, metal, 0, 0, 0, .012);
      const boardCanvas = document.createElement('canvas'); boardCanvas.width=1400; boardCanvas.height=800;
      const board = boardCanvas.getContext('2d');
      board.fillStyle='#fafcf7'; board.fillRect(0,0,1400,800);
      board.fillStyle='#194b68'; board.font='bold 65px sans-serif'; board.fillText('GuedesSEC / Home Lab',65,95);
      board.strokeStyle='#27856c'; board.lineWidth=6; board.beginPath(); board.moveTo(65,125); board.lineTo(1320,125); board.stroke();
      board.font='42px sans-serif';
      ['1. Conferir backups', '2. Atualizar os servidores', '3. Testar placa / solda', '4. Organizar a bancada'].forEach((line,i)=>board.fillText(line,70,210+i*85));
      board.fillStyle='#a54646'; board.font='bold 42px sans-serif'; board.fillText('REDE DO LAB',900,220);
      board.strokeStyle='#194b68'; board.strokeRect(955,265,220,85); board.strokeRect(955,440,220,85);
      board.fillStyle='#194b68'; board.font='32px sans-serif'; board.fillText('ROTEADOR',975,320); board.fillText('SERVIDOR',980,495);
      board.beginPath(); board.moveTo(1065,350); board.lineTo(1065,440); board.stroke();
      board.fillStyle='#27856c'; board.font='38px sans-serif'; board.fillText('Backup: di?rio   |   Rede: OK   |   Pr?xima tarefa: manuten??o',65,710);
      const boardTexture = new THREE.CanvasTexture(boardCanvas); boardTexture.colorSpace=THREE.SRGBColorSpace;
      boardTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
      const boardFace=new THREE.Mesh(new THREE.PlaneGeometry(1.66,.95),new THREE.MeshBasicMaterial({map:boardTexture,toneMapped:false}));
      boardFace.position.z=.04; g.add(boardFace);
      box(g,.65,.025,.12,metal,0,-.53,.06,.005);
      box(g,.18,.025,.03,solderBlue,-.18,-.5,.1,.005);
      // Cabos de rede acompanham a visibilidade de cada parede.
      const ethernetBlue = M('#147af3', .08, .5), cableClip = M('#d2d8df');
      function ethernetCable(side, points) {
        const parent = roomWalls[side].group;
        const path = new THREE.CurvePath();
        for (let i = 1; i < points.length; i++) {
          path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i - 1]), new THREE.Vector3(...points[i])));
        }
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, points.length * 8, .017, 6, false), ethernetBlue);
        mesh.castShadow = false;
        parent.add(mesh);
        for (const [x, y, z] of points) {
          const clip = box(parent, side === 'back' ? .055 : .026, .06, side === 'back' ? .026 : .055, cableClip, x, y, z, .004);
          clip.castShadow = false;
        }
      }
      for (let i = 0; i < 3; i++) {
        const y = 3.04 - i * .055;
        ethernetCable('back', [[-4.39,y,-3.397],[1.7+i*.065,y,-3.397],[1.7+i*.065,2.72,-3.397]]);
        ethernetCable('left', [[-4.397,y,-3.39],[-4.397,y,.9+i*.08],[-4.397,1.12,.9+i*.08]]);
      }
      ethernetCable('back', [[1.96,2.72,-3.397],[2.15,2.72,-3.397],[2.15,3.04,-3.397],[4.39,3.04,-3.397]]);
      ethernetCable('right', [[4.397,3.04,-3.39],[4.397,3.04,2.6],[4.397,.9,2.6]]);
      ethernetCable('back', [[1.84,2.72,-3.37],[1.84,2.35,-3.37],[1.45,2.35,-3.37],[1.45,1.16,-3.37]]);
      g = item('modemWifi', 'Modem Wi-Fi', 'wallBack', 1.9, 2.7, -3.29, 'Modem Wi-Fi com duas antenas, portas Ethernet e cabos azuis distribuindo a rede pelo laboratorio.');
      const routerShell = M('#e7ebed'), routerDark = M('#232c35');
      box(g, .56, .27, .15, routerShell, 0, 0, 0, .03);
      box(g, .48, .055, .018, routerDark, 0, -.065, .085, .008);
      for (let i = 0; i < 4; i++) sphere(g, .009, glow(i === 3 ? '#4fafff' : '#52ed9b'), -.16 + i * .105, -.065, .098);
      for (const side of [-1, 1]) {
        const antenna = new THREE.Group(); antenna.position.set(side * .21, .09, -.005); antenna.rotation.z = side * -.18; g.add(antenna);
        cyl(antenna, .017, .31, routerDark, 0, .15, 0, 10);
        sphere(antenna, .017, routerDark, 0, .305, 0);
      }
      for (let i = 0; i < 4; i++) box(g, .052, .027, .012, metal, -.13 + i * .085, -.13, .026, .002);
      for (let i = 0; i < 7; i++) box(g, .005, .065, .008, routerDark, -.09 + i * .03, .045, .08, .001);
      const pictureFrames = {}, pictureImages = {};
      function picture(id, label, x, y, col) {
        const g = item(id, label, 'wallBack', x, y, -3.35, 'Quadro decorativo do escritório.');
        box(g, .66, .86, .07, black, 0, 0, 0, .018);
        box(g, .55, .74, .015, M(col), 0, 0, .045, .012);
        const image = new THREE.Mesh(new THREE.PlaneGeometry(.55, .74), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }));
        image.position.set(0, 0, .061);
        image.visible = false;
        g.add(image);
        pictureFrames[id] = image;
      }
      picture('quadro1', 'Quadro 1', -.95, 2.45, '#3b4766'); picture('quadro2', 'Quadro 2', -.02, 2.45, '#55436b'); picture('quadro3', 'Quadro 3', .92, 2.45, '#3d5865');
      const defaultPictureAssets = {
        quadro1: new URL('../assets/quadro 1.jpg', import.meta.url).href,
        quadro2: new URL('../assets/quadro 3.jpg', import.meta.url).href,
        quadro3: new URL('../assets/quadro 4.jpg', import.meta.url).href
      };
      function loadDefaultPicture(id) {
        const source = defaultPictureAssets[id];
        if (!source || pictureImages[id]) return;
        const sourceImage = new Image();
        sourceImage.onload = () => {
          if (pictureImages[id]) return;
          const canvas = document.createElement('canvas');
          canvas.width = 660;
          canvas.height = 888;
          const context = canvas.getContext('2d');
          if (!context) {
            console.error('Não foi possível preparar a imagem padrão do quadro ' + id + '.');
            pictureStatus.textContent = 'Não foi possível preparar uma imagem padrão do quadro.';
            return;
          }
          const scale = Math.max(canvas.width / sourceImage.width, canvas.height / sourceImage.height);
          const cropWidth = canvas.width / scale, cropHeight = canvas.height / scale;
          context.drawImage(sourceImage, (sourceImage.width - cropWidth) / 2, (sourceImage.height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          setPictureTexture(id, texture);
        };
        sourceImage.onerror = error => {
          console.error('Não foi possível carregar a imagem padrão do quadro ' + id + '.', error);
          pictureStatus.textContent = 'Não foi possível carregar uma imagem padrão do quadro.';
        };
        sourceImage.src = source;
      }
      Object.keys(defaultPictureAssets).forEach(loadDefaultPicture);
      g = item('cortina', 'Quadro grande • GuedesSEC', 'wallLeft', -4.34, 1.8, -1.65, 'Quadro grande com a logo oficial da GuedesSEC.');
      const posterFrame = M('#121a20', .48, .34), posterTrim = M('#35d99a', .35, .36);
      box(g, .08, 2.18, 2.72, posterFrame, 0, 0, 0, .025);
      for (const z of [-1.34, 1.34]) box(g, .09, 2.1, .08, posterTrim, .055, 0, z, .015);
      for (const y of [-1.05, 1.05]) box(g, .09, .08, 2.7, posterTrim, .055, y, 0, .015);
      const posterCanvas = document.createElement('canvas');
      posterCanvas.width = 1200;
      posterCanvas.height = 900;
      const posterContext = posterCanvas.getContext('2d');
      const posterTexture = new THREE.CanvasTexture(posterCanvas);
      posterTexture.colorSpace = THREE.SRGBColorSpace;
      const posterImage = new THREE.Mesh(
        new THREE.PlaneGeometry(2.59, 2.01),
        new THREE.MeshBasicMaterial({ map: posterTexture, toneMapped: false })
      );
      posterImage.rotation.y = Math.PI / 2;
      posterImage.position.set(.052, 0, 0);
      g.add(posterImage);
      const guedesLogo = new Image();
      function paintPoster() {
        const context = posterContext;
        if (!context) return;
        if (guedesLogo.complete && guedesLogo.naturalWidth) {
          context.drawImage(guedesLogo, 0, 0, posterCanvas.width, posterCanvas.height);
        } else {
          context.fillStyle = '#080b0f';
          context.fillRect(0, 0, posterCanvas.width, posterCanvas.height);
          context.fillStyle = '#e9f4f1';
          context.textAlign = 'center';
          context.font = 'bold 120px Arial, sans-serif';
          context.fillText('GuedesSEC', 600, 470);
        }
        posterTexture.needsUpdate = true;
      }
      paintPoster();
      // Teclado, mouse e mousepad alinhados sobre a mesa.
      g = item('mousepad', 'Mousepad preto', 'desk', .3, 1.115, -2.43, 'Mousepad preto para teclado e mouse.'); const mousepadMaterial = M('#080a0d', .02, .92), mousepadStitching = M('#34383d', .05, .82); box(g, 1.8, .008, .56, mousepadMaterial, 0, .004, 0, .003); for (const x of [-.875, .875]) box(g, .008, .002, .50, mousepadStitching, x, .0085, 0, .001); for (const z of [-.27, .27]) box(g, 1.75, .002, .008, mousepadStitching, 0, .0085, z, .001);
      g = item('teclado', 'Teclado RGB', 'desk', -.15, 1.11715, -2.43, 'Teclado mecânico RGB com teclas individuais e keycaps legendadas.'); createKeyboard(g, .87, .24, .035); g.scale.y = .45;
      g = item('mouse', 'Mouse', 'desk', .85, 1.121, -2.43, 'Mouse do setup sobre o mousepad preto.'); box(g, .14, .075, .22, black, 0, .04, 0, .05);
      // Telas dinâmicas: canvas Matrix e terminal. Não depende de vídeo externo.
      function animatedCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return { canvas: c, ctx: c.getContext('2d') } }
      const matrix = animatedCanvas(1024, 576), terminal = animatedCanvas(900, 510);
      const matrixTex = new THREE.CanvasTexture(matrix.canvas), terminalTex = new THREE.CanvasTexture(terminal.canvas);
      const websitePages = {
        monitor1: animatedCanvas(1170, 600),
        monitor2: animatedCanvas(1740, 600)
      };
      const websiteTextures = {
        monitor1: new THREE.CanvasTexture(websitePages.monitor1.canvas),
        monitor2: new THREE.CanvasTexture(websitePages.monitor2.canvas)
      };
      for (const texture of Object.values(websiteTextures)) texture.colorSpace = THREE.SRGBColorSpace;
      matrixTex.colorSpace = terminalTex.colorSpace = THREE.SRGBColorSpace;
      const textureMat = t => new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide });
      const matrixMat = textureMat(matrixTex), terminalMat = textureMat(terminalTex);
      const websiteMaterials = {
        monitor1: textureMat(websiteTextures.monitor1),
        monitor2: textureMat(websiteTextures.monitor2)
      };
      const drops = Array.from({ length: 65 }, () => Math.random() * 576 / 16);
      let frame = 0;
      function paintScreens() {
        frame++; if (frame % 3 !== 0) return;
        const { ctx: m, canvas: mc } = matrix; m.fillStyle = 'rgba(0,6,4,.14)'; m.fillRect(0, 0, mc.width, mc.height); m.font = '18px monospace'; for (let i = 0; i < drops.length; i++) { const ch = '01アイウエカキクケコサシスセソ'; m.fillStyle = Math.random() > .96 ? '#d8ffe9' : '#16c46b'; m.fillText(ch[Math.floor(Math.random() * ch.length)], i * 16, drops[i] * 16); if (drops[i] * 16 > mc.height && Math.random() > .975) drops[i] = 0; drops[i] += .65; } matrixTex.needsUpdate = true;
        const { ctx: t, canvas: tc } = terminal; t.fillStyle = '#07120f'; t.fillRect(0, 0, tc.width, tc.height); t.fillStyle = '#173f2d'; t.fillRect(0, 0, tc.width, 43); t.fillStyle = '#b9ffda'; t.font = 'bold 21px monospace'; t.fillText('●  ●  ●   ubuntu@bibliotecadealexandria: ~', 18, 29); t.font = '20px monospace'; const lines = ['$ fastfetch', '  CodeJOHN • HOME LAB', '  OS: Ubuntu Server', '  Shell: bash', '  Services: Docker • Samba • Jellyfin', '  Network: LAN connected', '', '$ docker ps', '  casaos     running', '  jellyfin   running', '', '$ uptime', '  system online', '', '$ _']; lines.forEach((line, i) => { t.fillStyle = line.startsWith('$') ? '#70ffad' : '#b2c9c1'; t.fillText(line, 24, 83 + i * 30) }); t.fillStyle = '#42e29a'; t.fillRect(24, tc.height - 10, (frame * 2) % tc.width, 3); terminalTex.needsUpdate = true;
      }
      const defaultWebsiteUrl = 'https://guedessec.online/';
      const monitorVideos = {
        monitor1: { id: 'monitor1', video: document.createElement('video'), url: null, texture: null, websiteUrl: defaultWebsiteUrl, contentKind: 'website', status: document.getElementById('videoStatusLeft'), playButton: document.getElementById('playVideoLeft'), fileInput: document.getElementById('videoFileLeft'), websiteInput: document.getElementById('websiteUrlLeft'), websiteButton: document.getElementById('openWebsiteLeft'), websiteStatus: document.getElementById('websiteStatusLeft'), label: 'Monitor esquerdo', mesh: screenMeshes.monitor1, defaultMaterial: websiteMaterials.monitor1, defaultLabel: 'Site GuedesSEC' },
        monitor2: { id: 'monitor2', video: document.createElement('video'), url: null, texture: null, websiteUrl: defaultWebsiteUrl, contentKind: 'website', status: document.getElementById('videoStatusRight'), playButton: document.getElementById('playVideoRight'), fileInput: document.getElementById('videoFileRight'), websiteInput: document.getElementById('websiteUrlRight'), websiteButton: document.getElementById('openWebsiteRight'), websiteStatus: document.getElementById('websiteStatusRight'), label: 'Monitor ultrawide', mesh: screenMeshes.monitor2, defaultMaterial: websiteMaterials.monitor2, defaultLabel: 'Site GuedesSEC' }
      };
      // Exibe o pr?prio v?deo HTML no plano do monitor, sem reamostrar seus frames no WebGL.
      const videoScene = new THREE.Scene(), videoRenderer = new CSS3DRenderer();
      videoRenderer.setSize(innerWidth, innerHeight);
      videoRenderer.domElement.id = 'monitorVideoLayer';
      document.body.append(videoRenderer.domElement);
      addEventListener('resize', () => videoRenderer.setSize(innerWidth, innerHeight));
      for (const monitor of Object.values(monitorVideos)) {
        const size = monitor.mesh.geometry.parameters;
        const width = size.width, height = size.height;
        const video = monitor.video;
        video.style.width = '1280px';
        video.style.height = (1280 * height / width) + 'px';
        video.style.objectFit = 'contain';
        video.style.background = '#000';
        video.style.pointerEvents = 'none';
        monitor.htmlScreen = new CSS3DObject(video);
        monitor.htmlScreen.scale.setScalar(width / 1280);
        videoScene.add(monitor.htmlScreen);
      }
      const screenPosition = new THREE.Vector3(), screenNormal = new THREE.Vector3();
      const screenRay = new THREE.Raycaster();
      function renderMonitorVideos() {
        for (const monitor of Object.values(monitorVideos)) {
          const screen = monitor.htmlScreen;
          monitor.mesh.getWorldPosition(screenPosition);
          monitor.mesh.getWorldQuaternion(screen.quaternion);
          screenNormal.set(0, 0, 1).applyQuaternion(screen.quaternion);
          screen.position.copy(screenPosition).addScaledVector(screenNormal, .006);
          const towardCamera = camera.position.clone().sub(screen.position);
          let visible = monitor.contentKind === 'video' && !!monitor.url && screenNormal.dot(towardCamera) > 0;
          if (visible) {
            screenRay.set(screen.position.clone().addScaledVector(screenNormal, .02), towardCamera.normalize());
            const obstruction = screenRay.intersectObjects(scene.children, true).find(h => h.object !== monitor.mesh && isSceneVisible(h.object));
            visible = !obstruction || obstruction.distance > camera.position.distanceTo(screen.position);
          }
          screen.visible = visible;
        }
        videoRenderer.render(videoScene, camera);
      }
      const websiteStorage = 'codejohn.homelab.monitor-sites.v2';
      try {
        const savedWebsites = JSON.parse(localStorage.getItem(websiteStorage) || '{}');
        for (const monitor of Object.values(monitorVideos)) {
          const value = savedWebsites[monitor.id];
          if (typeof value === 'string') {
            const url = new URL(value);
            if (url.protocol === 'https:' || url.protocol === 'http:') {
              monitor.websiteUrl = url.href;
              monitor.contentKind = 'website';
              monitor.websiteInput.value = url.href;
              monitor.websiteStatus.textContent = 'Site salvo • clique no monitor para abrir.';
            }
          }
        }
      } catch (error) {
        console.warn('Não foi possível restaurar as URLs dos sites dos monitores.', error);
      }
      function paintWebsitePreview(monitor) {
        const { canvas, ctx } = websitePages[monitor.id];
        if (!ctx) return;
        const scale = canvas.height / 600;
        const hostname = new URL(monitor.websiteUrl).hostname;
        const isGuedesSec = hostname === 'guedessec.online' || hostname.endsWith('.guedessec.online');
        ctx.fillStyle = '#0a1118';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#101b23';
        ctx.fillRect(0, 0, canvas.width, 72 * scale);
        ctx.fillStyle = '#35d99a';
        ctx.fillRect(0, 69 * scale, canvas.width, 3 * scale);
        if (isGuedesSec && guedesLogo.complete && guedesLogo.naturalWidth) {
          ctx.drawImage(guedesLogo, 25 * scale, 8 * scale, 58 * scale, 58 * scale);
        } else {
          ctx.fillStyle = '#35d99a';
          ctx.font = `bold ${32 * scale}px Arial, sans-serif`;
          ctx.fillText('</>', 28 * scale, 49 * scale);
        }
        ctx.fillStyle = '#e8f1ef';
        ctx.font = `bold ${25 * scale}px Arial, sans-serif`;
        ctx.fillText(isGuedesSec ? 'GuedesSEC' : hostname, 96 * scale, 43 * scale);
        ctx.fillStyle = '#9bffc7';
        ctx.font = `${16 * scale}px Arial, sans-serif`;
        ctx.fillText(hostname, 96 * scale, 62 * scale);
        if (isGuedesSec) {
          ctx.fillStyle = '#d7e3e1';
          ctx.font = `bold ${38 * scale}px Arial, sans-serif`;
          ctx.fillText('Bem-vindo à Biblioteca de Alexandria', 42 * scale, 155 * scale, canvas.width - 84 * scale);
          ctx.font = `${21 * scale}px Arial, sans-serif`;
          ctx.fillStyle = '#9eafae';
          ctx.fillText('ISOs, livros, códigos e links para jogos em um só lugar.', 44 * scale, 194 * scale, canvas.width - 88 * scale);
          const cardY = 260 * scale, cardGap = 18 * scale, left = 44 * scale;
          const cardWidth = (canvas.width - left * 2 - cardGap * 2) / 3;
          ['ISOs', 'Livros', 'DevTools'].forEach((title, index) => {
            const x = left + index * (cardWidth + cardGap);
            ctx.fillStyle = '#14232a';
            ctx.fillRect(x, cardY, cardWidth, 190 * scale);
            ctx.strokeStyle = '#2c5948';
            ctx.lineWidth = 2 * scale;
            ctx.strokeRect(x, cardY, cardWidth, 190 * scale);
            ctx.fillStyle = '#55e6a4';
            ctx.font = `bold ${25 * scale}px Arial, sans-serif`;
            ctx.fillText(title, x + 24 * scale, cardY + 56 * scale);
            ctx.fillStyle = '#9eafae';
            ctx.font = `${17 * scale}px Arial, sans-serif`;
            ctx.fillText('Acessar recursos', x + 24 * scale, cardY + 98 * scale);
          });
        } else {
          ctx.fillStyle = '#d7e3e1';
          ctx.font = `bold ${44 * scale}px Arial, sans-serif`;
          ctx.fillText(hostname, 44 * scale, 175 * scale, canvas.width - 88 * scale);
          ctx.fillStyle = '#9eafae';
          ctx.font = `${22 * scale}px Arial, sans-serif`;
          ctx.fillText('Clique no monitor para abrir o site.', 46 * scale, 220 * scale);
        }
        websiteTextures[monitor.id].needsUpdate = true;
        monitor.mesh.material = monitor.defaultMaterial;
      }
      for (const monitor of Object.values(monitorVideos)) {
        monitor.websiteInput.value = monitor.websiteUrl;
        monitor.contentKind = 'website';
        monitor.status.textContent = 'Site GuedesSEC';
        monitor.websiteStatus.textContent = 'GuedesSEC configurado • clique no monitor para abrir.';
        paintWebsitePreview(monitor);
      }
      guedesLogo.onload = () => {
        paintPoster();
        for (const monitor of Object.values(monitorVideos)) paintWebsitePreview(monitor);
      };
      guedesLogo.onerror = error => console.warn('Não foi possível carregar a logo GuedesSEC para os monitores e o quadro.', error);
      guedesLogo.src = './assets/guedessec.png';
      for (const monitor of Object.values(monitorVideos)) {
        monitor.video.muted = false;
        monitor.video.volume = 1;
        monitor.video.loop = true;
        monitor.video.playsInline = true;
        monitor.video.preload = 'auto';
        monitor.video.addEventListener('play', () => { monitor.playButton.textContent = '⏸ Pausar' });
        monitor.video.addEventListener('pause', () => { monitor.playButton.textContent = '▶ Reproduzir' });
      }
      const previewVideo = document.getElementById('bigVideo');
      // O som vem do monitor 3D; a pr?via n?o deve reproduzir outra faixa por cima.
      previewVideo.muted = true;
      const websiteFrame = document.getElementById('websiteFrame');
      const openWebsiteTab = document.getElementById('openWebsiteTab');
      const screenViewMessage = document.getElementById('screenViewMessage');
      let previewMonitorId = null;
      function showMonitorPreview(id) {
        const monitor = monitorVideos[id];
        if (!monitor || monitor.contentKind === 'default') return;
        previewMonitorId = id;
        document.getElementById('screenViewTitle').textContent = '🖥️ ' + monitor.label;
        if (monitor.contentKind === 'website' && monitor.websiteUrl) {
          previewVideo.pause();
          previewVideo.hidden = true;
          websiteFrame.hidden = false;
          openWebsiteTab.href = monitor.websiteUrl;
          openWebsiteTab.hidden = false;
          screenViewMessage.textContent = 'Se o site não aparecer, ele pode bloquear a incorporação. Tente abrir em uma nova aba.';
          websiteFrame.src = monitor.websiteUrl;
          document.getElementById('screenView').style.display = 'flex';
          return;
        }
        if (!monitor.url) return;
        websiteFrame.hidden = true;
        websiteFrame.src = 'about:blank';
        openWebsiteTab.hidden = true;
        previewVideo.hidden = false;
        screenViewMessage.textContent = 'Vídeos locais são exibidos somente neste navegador.';
        previewVideo.src = monitor.url;
        document.getElementById('screenView').style.display = 'flex';
        previewVideo.play().catch(error => console.warn('Não foi possível iniciar a prévia do vídeo.', error));
      }
      function saveMonitorWebsites() {
        try {
          localStorage.setItem(websiteStorage, JSON.stringify({
            monitor1: monitorVideos.monitor1.websiteUrl,
            monitor2: monitorVideos.monitor2.websiteUrl
          }));
          return true;
        } catch (error) {
          console.error('Não foi possível salvar as URLs dos sites dos monitores.', error);
          return false;
        }
      }
      function configureWebsite(id) {
        const monitor = monitorVideos[id];
        const enteredUrl = monitor.websiteInput.value.trim();
        let url;
        try {
          url = new URL(enteredUrl);
          if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Use uma URL iniciada por http:// ou https://.');
        } catch (error) {
          monitor.websiteStatus.textContent = error instanceof TypeError ? 'Digite uma URL válida, começando com https:// ou http://.' : error.message;
          return;
        }
        monitor.websiteUrl = url.href;
        monitor.contentKind = 'website';
        monitor.video.pause();
        monitor.websiteInput.value = url.href;
        monitor.status.textContent = 'Site ' + url.hostname;
        paintWebsitePreview(monitor);
        monitor.websiteStatus.textContent = saveMonitorWebsites()
          ? 'Site configurado e salvo • clique no monitor para abrir.'
          : 'Site configurado, mas não foi possível salvar. Veja o console.';
        showMonitorPreview(id);
      }
      monitorVideos.monitor1.websiteButton.onclick = () => configureWebsite('monitor1');
      monitorVideos.monitor2.websiteButton.onclick = () => configureWebsite('monitor2');
      function setMatrix() {
        for (const monitor of Object.values(monitorVideos)) {
          monitor.video.pause();
          monitor.contentKind = 'default';
          monitor.mesh.material = monitor.defaultMaterial;
          monitor.status.textContent = monitor.defaultLabel;
        }
      }
      document.getElementById('matrixMode').onclick = setMatrix;
      document.getElementById('playBothMonitors').onclick = () => {
        // Inicia ambos diretamente no clique para liberar ?udio nos dois v?deos.
        for (const monitor of Object.values(monitorVideos)) {
          if (!monitor.url) {
            monitor.status.textContent = 'Escolha um v?deo para este monitor.';
            continue;
          }
          monitor.contentKind = 'video';
          monitor.mesh.material = monitor.videoMaterial;
          monitor.video.muted = false;
          monitor.video.volume = 1;
          monitor.video.play().catch(error => {
            console.warn('N?o foi poss?vel iniciar ' + monitor.label, error);
            monitor.status.textContent = 'Clique em Reproduzir neste monitor para liberar o som.';
          });
        }
      };

      for (const [id, monitor] of Object.entries(monitorVideos)) {
        monitor.fileInput.addEventListener('change', async e => {
          const file = e.target.files?.[0];
          monitor.fileInput.value = '';
          if (!file) return;
          if (monitor.url) URL.revokeObjectURL(monitor.url);
          monitor.video.pause();
          monitor.url = URL.createObjectURL(file);
          monitor.video.src = monitor.url;
          monitor.contentKind = 'video';
          monitor.texture ??= new THREE.VideoTexture(monitor.video);
          monitor.texture.colorSpace = THREE.SRGBColorSpace;
          // Filtra o v?deo em perspectiva para preservar detalhes nas telas do cen?rio.
          monitor.texture.generateMipmaps = false;
          monitor.texture.minFilter = THREE.LinearFilter;
          monitor.texture.magFilter = THREE.LinearFilter;
          monitor.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          monitor.videoMaterial = textureMat(monitor.texture);
          monitor.mesh.material = monitor.videoMaterial;
          monitor.status.textContent = file.name;
          try {
            await monitor.video.play();
          } catch (error) {
            console.warn('Não foi possível iniciar o vídeo em ' + monitor.label + '.', error);
            monitor.status.textContent = file.name + ' • clique em Reproduzir';
          }
          if (document.getElementById('screenView').style.display === 'flex' && previewMonitorId === id) {
            websiteFrame.hidden = true;
            websiteFrame.src = 'about:blank';
            openWebsiteTab.hidden = true;
            previewVideo.hidden = false;
            previewVideo.src = monitor.url;
          }
        });
        monitor.playButton.onclick = () => {
          if (!monitor.url) { monitor.fileInput.click(); return }
          if (monitor.video.paused) {
            monitor.video.muted = false;
            monitor.video.volume = 1;
            monitor.contentKind = 'video';
            monitor.mesh.material = monitor.videoMaterial;
            monitor.video.play().catch(error => {
              console.warn('Não foi possível reproduzir o vídeo em ' + monitor.label + '.', error);
              monitor.status.textContent = 'Falha ao reproduzir ' + monitor.url.split('/').pop();
            });
          }
          else monitor.video.pause();
        };
      }
      document.getElementById('closeScreen').onclick = () => { document.getElementById('screenView').style.display = 'none'; previewVideo.pause(); websiteFrame.src = 'about:blank'; previewMonitorId = null };
      // Avatar.
      const avatar = new THREE.Group(); scene.add(avatar);
      const skin = M('#bd896c'), shirt = M('#080808'), shirtLight = M('#151515'), pants = M('#17191e'), hair = M('#292725'), shoeMat = M('#20242b'), eyeMat = M('#16191d');
      box(avatar, .34, .2, .22, pants, 0, .7, 0, .055);
      box(avatar, .4, .45, .25, shirt, 0, 1.02, 0, .085);
      box(avatar, .43, .15, .26, shirtLight, 0, 1.19, 0, .055);
      box(avatar, .36, .12, .255, black, 0, .81, .004, .025);
      box(avatar, .07, .018, .008, M('#bd9a57'), 0, .81, .136, .003);
      // Estampa GuedesSEC na frente e nas costas da camisa.
      const shirtLogo = new THREE.TextureLoader().load('./assets/guedessec.png');
      shirtLogo.colorSpace = THREE.SRGBColorSpace;
      shirtLogo.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const shirtPrintMaterial = new THREE.MeshBasicMaterial({ map: shirtLogo, toneMapped: false });
      for (const side of [1, -1]) {
        const print = new THREE.Mesh(new THREE.PlaneGeometry(.27, .294), shirtPrintMaterial);
        print.position.set(0, 1.075, side * .132);
        if (side < 0) print.rotation.y = Math.PI;
        avatar.add(print);
      }
      cyl(avatar, .075, .12, skin, 0, 1.32, 0);
      sphere(avatar, .19, skin, 0, 1.55, .012);

      sphere(avatar, .168, skin, 0, 1.54, .045);
      // Laterais raspadas e moicano magenta em pontas.
      const punkHair = M('#ed167b', .12, .5), studs = M('#cbd3db', .85, .25);
      box(avatar, .075, .09, .28, punkHair, 0, 1.73, .005, .018);
      for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(.052, .20 + .035 * Math.sin(i / 5 * Math.PI), 4), punkHair);
        spike.position.set(0, 1.85, -.12 + i * .05);
        avatar.add(spike);
      }
      // Jaqueta aberta, com lapelas e tachas nas laterais da estampa.
      for (const side of [-1, 1]) {
        const lapel = box(avatar, .055, .23, .025, shirtLight, side * .173, 1.15, .14, .008);
        lapel.rotation.z = side * -.22;
        for (let i = 0; i < 4; i++) sphere(avatar, .012, studs, side * .19, 1.04 + i * .06, .16);
        const earring = new THREE.Mesh(new THREE.TorusGeometry(.027, .006, 6, 16), studs);
        earring.position.set(side * .205, 1.51, .025);
        avatar.add(earring);
      }
      cyl(avatar, .079, .035, shirt, 0, 1.35, 0);
      for (const x of [-.04, 0, .04]) sphere(avatar, .009, studs, x, 1.35, .075);
      // Corrente prateada pendurada no quadril.
      for (let i = 0; i < 9; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(.014, .004, 5, 10), studs);
        link.position.set(.09 + i * .013, .79 - .065 * Math.sin(i / 8 * Math.PI), .145);
        avatar.add(link);
      }
      for (const side of [-1, 1]) {
        sphere(avatar, .045, skin, side * .185, 1.55, .005);
        sphere(avatar, .024, M('#d3a18a'), side * .193, 1.55, .02);
        sphere(avatar, .021, white, side * .071, 1.56, .181);
        sphere(avatar, .010, eyeMat, side * .071, 1.56, .198);
        box(avatar, .045, .012, .012, hair, side * .071, 1.595, .188, .004);
      }
      sphere(avatar, .026, skin, 0, 1.515, .205);
      box(avatar, .055, .009, .008, M('#764c45'), 0, 1.468, .19, .003);
      box(avatar, .17, .018, .008, shirtLight, 0, 1.26, .132, .004);
      const legs = [], knees = [], arms = [], elbows = [];
      for (const side of [-1, 1]) {
        const hip = new THREE.Group();
        hip.position.set(side * .115, .68, 0);
        avatar.add(hip);
        legs.push(hip);
        box(hip, .155, .36, .17, pants, 0, -.18, 0, .035);
        const knee = new THREE.Group();
        knee.position.y = -.36;
        hip.add(knee);
        knees.push(knee);
        sphere(knee, .073, pants, 0, 0, 0);
        box(knee, .13, .35, .145, pants, 0, -.17, 0, .035);
        box(knee, .15, .08, .27, shoeMat, 0, -.355, .045, .025);
        box(knee, .16, .18, .18, shoeMat, 0, -.25, .005, .02);
        box(knee, .17, .035, .29, black, 0, -.39, .045, .008);
        for (let i = 0; i < 4; i++) box(knee, .065, .008, .012, studs, 0, -.19 - i * .033, .1, .002);
        box(knee, .11, .07, .012, skin, 0, -.015, .079, .008);

        const shoulder = new THREE.Group();
        shoulder.position.set(side * .245, 1.22, 0);
        avatar.add(shoulder);
        arms.push(shoulder);
        sphere(shoulder, .105, shirtLight, 0, 0, 0);
        for (let i = 0; i < 3; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(.018, .055, 5), studs);
          spike.position.set((i - 1) * .045, .105, 0);
          shoulder.add(spike);
        }
        box(shoulder, .14, .29, .15, shirt, 0, -.145, 0, .045);
        const elbow = new THREE.Group();
        elbow.position.y = -.28;
        shoulder.add(elbow);
        elbows.push(elbow);
        sphere(elbow, .055, shirt, 0, 0, 0);
        box(elbow, .105, .25, .11, shirtLight, 0, -.12, 0, .035);
        box(elbow, .12, .055, .125, black, 0, -.215, 0, .01);
        for (const x of [-.035, 0, .035]) sphere(elbow, .01, studs, x, -.215, .067);
        box(elbow, .07, .045, .055, skin, 0, -.25, .015, .018);
        for (let finger = 0; finger < 3; finger++) box(elbow, .014, .042, .014, skin, -.02 + finger * .02, -.285, .035, .006);
      }
      avatar.position.set(-1.2, 0, 2.45);
      // NPCs independentes do personagem controlado pelo jogador.
      const npcs = [];
      function createNpc(name, skinColor, outfitColor, x, z, style) {
        const root = new THREE.Group();
        root.position.set(x, 0, z);
        root.rotation.y = -.35;
        scene.add(root);
        const skinMat = M(skinColor), outfit = M('#080808'), trousers = M(style === 'military' ? '#454f32' : '#242a35');
        const darkHair = M('#241910'), boots = M('#16191b');
        box(root, .4, .47, .25, outfit, 0, 1.035, 0, .065);
        for (const side of [1, -1]) {
          const print = new THREE.Mesh(new THREE.PlaneGeometry(.27, .294), shirtPrintMaterial);
          print.position.set(0, 1.07, side * .134);
          if (side < 0) print.rotation.y = Math.PI;
          root.add(print);
        }
        const npcArms = [], npcLegs = [];
        box(root, .34, .16, .22, trousers, 0, .75, 0, .035);
        cyl(root, .065, .1, skinMat, 0, 1.32, 0);
        const head = new THREE.Group();
        head.position.y = 1.53;
        root.add(head);
        sphere(head, .18, skinMat, 0, 0, .015);
        for (const side of [-1, 1]) {
          sphere(head, .037, skinMat, side * .176, 0, .01);
          sphere(head, .019, white, side * .065, .025, .173);
          sphere(head, .009, eyeMat, side * .065, .025, .188);
          box(head, .042, .01, .012, darkHair, side * .065, .062, .171, .003);
          const leg = new THREE.Group(); leg.position.set(side * .105, .735, 0); root.add(leg); npcLegs.push(leg);
          box(leg, .145, .62, .17, trousers, 0, -.31, 0, .03);
          box(leg, .16, .13, .27, boots, 0, -.66, .045, .025);
          const arm = new THREE.Group();
          arm.position.set(side * .255, 1.2, 0);
          arm.rotation.z = side * .08;
          root.add(arm); npcArms.push(arm);
          box(arm, .14, .24, .16, outfit, 0, -.1, 0, .035);
          box(arm, .105, .27, .12, style === 'military' ? outfit : skinMat, 0, -.335, 0, .025);
          sphere(arm, .06, skinMat, 0, -.49, .01);
        }
        sphere(head, .022, skinMat, 0, -.02, .193);
        box(head, .052, .009, .009, M('#86514c'), 0, -.075, .173, .003);
        if (style === 'curly') {
          // Cachos volumosos ao redor do topo e das laterais, sem cobrir o rosto.
          for (let row = 0; row < 5; row++) {
            for (let i = 0; i < 12; i++) {
              const angle = i / 12 * Math.PI * 2;
              const radius = row < 2 ? .13 + row * .045 : .19;
              const curlX = Math.cos(angle) * radius;
              const curlZ = Math.sin(angle) * radius;
              if (row > 1 && curlZ > .08) continue;
              sphere(head, .057, darkHair, curlX, .16 - row * .065, curlZ);
            }
          }
          sphere(head, .065, darkHair, 0, .18, 0);
        } else {
          sphere(head, .182, darkHair, 0, .075, -.025);
          // Deixa a testa e o rosto descobertos.
          sphere(head, .165, skinMat, 0, -.008, .04);
          if (style === 'military') {
            const camoDark = M('#293b28'), camoTan = M('#92916a');
            cyl(head, .19, .09, outfit, 0, .17, 0);
            box(head, .28, .025, .18, outfit, 0, .135, .14, .015);
            for (const side of [-1, 1]) {
              box(root, .12, .1, .025, camoDark, side * .17, 1.09, .135, .006);
              box(root, .1, .035, .025, camoTan, side * .17, 1.16, .137, .004);
              box(root, .08, .09, .018, camoDark, side * .105, .49, .09, .006);
              box(root, .07, .055, .018, camoTan, side * .105, .29, .09, .004);
            }
            box(root, .35, .045, .26, boots, 0, .83, 0, .008);
          }
        }
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 512; labelCanvas.height = 128;
        const ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = '#0a161ee6';
        ctx.fillRect(0, 12, 512, 104);
        ctx.fillStyle = '#f6fffb'; ctx.font = 'bold 52px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(name, 256, 64);
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.colorSpace = THREE.SRGBColorSpace;
        const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, toneMapped: false }));
        label.position.y = 2.04; label.scale.set(.86, .215, 1);
        root.add(label);
        npcs.push({ name, root, head, arms: npcArms, legs: npcLegs, taskIndex: npcs.length, wait: 1 + npcs.length, path: [], phase: 0 });
        return root;
      }
      createNpc('Vitória', '#efd0b9', '#984b78', .7, 1.55, 'curly');
      createNpc('Xandy', '#643b28', '#315d8a', 2.05, .25, 'casual');
      createNpc('Alex', '#e7c3a9', '#626d43', 2.2, 2.25, 'military');

      let edit = false, selected = null, dragging = false, camDrag = false, oldX = 0, oldY = 0, pitch = .74, yaw = Math.PI / 4, zoom = 1, near = null; const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3(), offset = new THREE.Vector3(); const keys = new Set();       const list = document.getElementById('list'), selText = document.getElementById('selected'), height = document.getElementById('height'), addPicture = document.getElementById('addPicture'), pictureFile = document.getElementById('pictureFile'), pictureStatus = document.getElementById('pictureStatus'); for (const o of objects) { const b = document.createElement('button'); b.textContent = o.label; b.onclick = () => select(o); list.append(b); o.button = b }
      let interactionPose = null, interactionTime = 0, savedAvatarPosition = null, savedAvatarRotation = 0;
      function stopInteraction() {
        if (!interactionPose) return;
        interactionPose = null;
        if (savedAvatarPosition) avatar.position.copy(savedAvatarPosition);
        avatar.rotation.y = savedAvatarRotation;
        savedAvatarPosition = null;
        legs.forEach(leg => { leg.rotation.set(0, 0, 0) });
        knees.forEach(knee => { knee.rotation.set(0, 0, 0) });
        arms.forEach(arm => { arm.rotation.set(0, 0, 0) });
        elbows.forEach(elbow => { elbow.rotation.set(0, 0, 0) });
        document.getElementById('status').textContent = 'Você levantou da cadeira.';
      }
      function startInteraction(action) {
        if (!savedAvatarPosition) {
          savedAvatarPosition = avatar.position.clone();
          savedAvatarRotation = avatar.rotation.y;
        }
        interactionPose = action;
        interactionTime = 0;
        const chair = byId.cadeira.g.position;
        const chairRotation = byId.cadeira.g.rotation.y;
        const seatOffset = new THREE.Vector3(0, .24, .2).applyAxisAngle(new THREE.Vector3(0, 1, 0), chairRotation);
        avatar.position.set(chair.x + seatOffset.x, seatOffset.y, chair.z + seatOffset.z);
        avatar.rotation.y = chairRotation;
        legs.forEach(leg => { leg.rotation.set(-1.05, 0, 0) });
        knees.forEach(knee => { knee.rotation.set(.55, 0, 0) });
        arms.forEach(arm => { arm.rotation.set(-.65, 0, 0) });
        elbows.forEach(elbow => { elbow.rotation.set(0, 0, 0) });
        if (action === 'mouse') {
          arms[0].rotation.x = -.6;
          arms[0].rotation.z = .06;
        }
        document.getElementById('status').textContent = action === 'sit'
          ? 'Sentado. Espaço: digitar • M: usar o mouse • E: levantar'
          : action === 'typing'
            ? 'Digitando no teclado • M: usar o mouse • E: levantar'
            : 'Mexendo no mouse • E: levantar';
      }
      const toolbar = document.getElementById('toolbar'), showToolbar = document.getElementById('showToolbar');
      document.getElementById('hideToolbar').onclick = () => { toolbar.style.display = 'none'; showToolbar.style.display = 'block' };
      if (matchMedia('(max-width: 700px)').matches) { toolbar.style.display = 'none'; showToolbar.style.display = 'block' }
      showToolbar.onclick = () => { toolbar.style.display = ''; showToolbar.style.display = 'none' };
      function select(o) { selected = o; objects.forEach(a => a.button.classList.toggle('active', a === o)); selText.textContent = o ? 'Selecionado: ' + o.label : 'Nenhum objeto selecionado'; height.disabled = !o || o.kind.startsWith('wall'); addPicture.disabled = !o || !pictureFrames[o.id]; if (o) height.value = o.g.position.y.toFixed(2); if (o && pictureFrames[o.id]) { document.getElementById('mediaTools').open = true; document.getElementById('pictureSection').open = true } pictureStatus.textContent = o && pictureFrames[o.id] ? (pictureImages[o.id] ? 'Imagem personalizada neste quadro.' : 'Escolha uma imagem do seu dispositivo.') : 'Selecione um quadro para adicionar uma imagem.' }
      function setPictureTexture(id, texture) { const image = pictureFrames[id]; if (!image) return; texture.colorSpace = THREE.SRGBColorSpace; image.material.map?.dispose(); image.material.map = texture; image.material.needsUpdate = true; image.visible = true }
      addPicture.onclick = () => { if (selected && pictureFrames[selected.id]) pictureFile.click() };
      pictureFile.addEventListener('change', async e => {
        const file = e.target.files?.[0], frameId = selected?.id;
        pictureFile.value = '';
        if (!file || !frameId || !pictureFrames[frameId]) return;
        if (!file.type.startsWith('image/')) { pictureStatus.textContent = 'Selecione um arquivo de imagem válido.'; return }
        if (file.size > 15 * 1024 * 1024) { pictureStatus.textContent = 'A imagem deve ter no máximo 15 MB.'; return }
        let bitmap;
        try {
          bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas'), width = 660, height = 888;
          canvas.width = width; canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Não foi possível preparar a imagem.');
          const scale = Math.max(width / bitmap.width, height / bitmap.height), cropWidth = width / scale, cropHeight = height / scale;
          context.drawImage(bitmap, (bitmap.width - cropWidth) / 2, (bitmap.height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
          const imageData = canvas.toDataURL('image/jpeg', .88), texture = new THREE.CanvasTexture(canvas);
          setPictureTexture(frameId, texture);
          pictureImages[frameId] = imageData;
          save();
          pictureStatus.textContent = 'Imagem adicionada e salva neste navegador.';
        } catch (error) {
          console.error('Não foi possível carregar a imagem do quadro.', error);
          pictureStatus.textContent = 'Não foi possível carregar essa imagem. Tente outro arquivo.';
        } finally {
          bitmap?.close();
        }
      });
      function cameraUpdate() { const aspect = innerWidth / innerHeight, size = innerWidth < 700 ? 6.8 : 5.2; camera.left = -size * aspect / zoom; camera.right = size * aspect / zoom; camera.top = size / zoom; camera.bottom = -size / zoom; camera.position.set(Math.sin(yaw) * 16 * Math.cos(pitch), 1.05 + 16 * Math.sin(pitch), Math.cos(yaw) * 16 * Math.cos(pitch)); camera.lookAt(0, 1.05, 0); camera.updateProjectionMatrix();
        // Oculta as paredes voltadas para a camera para abrir a vista do interior.
        for (const entry of Object.values(roomWalls)) {
          entry.group.visible = camera.position.x * entry.nx + camera.position.z * entry.nz <= .05;
        }
        for (const o of objects) {
          if (o.kind === 'wallBack') o.g.visible = roomWalls.back.group.visible;
          else if (o.kind === 'wallLeft') o.g.visible = roomWalls.left.group.visible;
        }
      } cameraUpdate(); addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cameraUpdate() });
      function point(e) { const r = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(pointer, camera) } function target(e) { point(e); const hits = ray.intersectObjects(objects.map(o => o.g), true).filter(h => isSceneVisible(h.object)); if (!hits.length) return null; let n = hits[0].object; while (n && !n.userData.id) n = n.parent; return n ? byId[n.userData.id] : null }
      // Colisões simples: limites reais do cômodo e volumes dos móveis.
      const ROOM = { minX: -4.42, maxX: 4.42, minZ: -3.42, maxZ: 3.42 };
      const colliderBox = new THREE.Box3();
      function footprint(o) {
        o.g.updateWorldMatrix(true, true);
        const b = new THREE.Box3().setFromObject(o.g);
        // Objetos fixados à parede não bloqueiam o chão.
        return b;
      }
      function fitsRoom(o) {
        if (o.kind.startsWith('wall')) return true;
        const b = footprint(o), eps = .012;
        return b.min.x >= ROOM.minX - eps && b.max.x <= ROOM.maxX + eps && b.min.z >= ROOM.minZ - eps && b.max.z <= ROOM.maxZ + eps && b.min.y >= -.06;
      }
      function overlapsSolid(o) {
        if (o.kind.startsWith('wall')) return false;
        const a = footprint(o);
        for (const other of objects) {
          if (other === o || other.kind.startsWith('wall')) continue;
          const b = footprint(other);
          // Apenas colisão se houver interseção significativa nos três eixos.
          const ix = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
          const iy = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
          const iz = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
          if (ix > .07 && iz > .07 && iy > .10) {
            // Peças inicialmente sobre a mesa podem permanecer ali; bloquear novas sobreposições
            // é tratado no arraste somente se não havia interseção na posição anterior.
            return true;
          }
        }
        return false;
      }
      function moveSafe(o, position, rotation = o.g.rotation.y) {
        const oldPos = o.g.position.clone(), oldRot = o.g.rotation.y;
        const wasOverlapping = overlapsSolid(o);
        o.g.position.copy(position); o.g.rotation.y = rotation;
        const valid = fitsRoom(o) && (!overlapsSolid(o) || wasOverlapping);
        if (!valid) { o.g.position.copy(oldPos); o.g.rotation.y = oldRot; return false }
        return true;
      }
      let roomColliders = null, colliderLayout = '';
      function refreshRoomColliders() {
        const layout = objects.map(o => [o.g.position.x, o.g.position.y, o.g.position.z, o.g.rotation.y, o.g.scale.x, o.g.scale.y, o.g.scale.z].join(',')).join(';');
        if (roomColliders && layout === colliderLayout) return;
        colliderLayout = layout;
        roomColliders = objects.filter(o => !o.kind.startsWith('wall')).map(o => footprint(o)).filter(b => b.min.y <= .95 && b.max.y >= .12);
      }
      function roomBlocked(x, z) {
        if (x < ROOM.minX + .22 || x > ROOM.maxX - .22 || z < ROOM.minZ + .22 || z > ROOM.maxZ - .22) return true;
        if (!roomColliders) refreshRoomColliders();
        for (const b of roomColliders) {
          const cx = Math.max(b.min.x, Math.min(x, b.max.x));
          const cz = Math.max(b.min.z, Math.min(z, b.max.z));
          if ((x - cx) ** 2 + (z - cz) ** 2 < .23 ** 2) return true;
        }
        return false;
      }
      function avatarBlocked(x, z) {
        return roomBlocked(x, z) || npcs.some(npc => Math.hypot(x - npc.root.position.x, z - npc.root.position.z) < .46);
      }
      const npcTasks = [
        { id: 'estante', action: 'books' },
        { id: 'servidor', action: 'inspect' },
        { id: 'bancada', action: 'work' },
        { id: 'mesa', action: 'work' },
        { id: 'mesaL', action: 'work' },
        { id: 'rackServidor', action: 'inspect' }
      ];
      // Busca no piso livre: escolhe o ponto acessivel mais perto do movel da tarefa.
      function planNpcTask(npc) {
        const task = npcTasks[npc.taskIndex % npcTasks.length];
        npc.taskIndex++;
        npc.task = task;
        const destination = byId[task.id].g.position;
        const step = .3, start = npc.root.position;
        const queue = [{ x: start.x, z: start.z, parent: -1, gx: 0, gz: 0 }], seen = new Set(['0,0']);
        let best = 0, bestDistance = Infinity;
        for (let i = 0; i < queue.length && i < 1800; i++) {
          const node = queue[i], distance = Math.hypot(node.x - destination.x, node.z - destination.z);
          if (distance < bestDistance) { bestDistance = distance; best = i; }
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const gx = node.gx + dx, gz = node.gz + dz, key = gx + ',' + gz;
            if (seen.has(key)) continue;
            seen.add(key);
            const x = start.x + gx * step, z = start.z + gz * step;
            if (roomBlocked(x, z) || roomBlocked((x + node.x) / 2, (z + node.z) / 2)) continue;
            queue.push({ x, z, gx, gz, parent: i });
          }
        }
        npc.path = [];
        for (let i = best; queue[i].parent !== -1; i = queue[i].parent) npc.path.unshift(queue[i]);
      }
      function updateNpcs(dt, t) {
        if (edit) return;
        for (const npc of npcs) {
          npc.phase += dt;
          const pos = npc.root.position;
          if (npc.path.length) {
            const goal = npc.path[0], dx = goal.x - pos.x, dz = goal.z - pos.z, distance = Math.hypot(dx, dz);
            const step = Math.min(distance, dt * .75);
            const x = pos.x + dx / (distance || 1) * step, z = pos.z + dz / (distance || 1) * step;
            const occupied = Math.hypot(x - avatar.position.x, z - avatar.position.z) < .48 || npcs.some(other => other !== npc && Math.hypot(x - other.root.position.x, z - other.root.position.z) < .44);
            if (!occupied && !roomBlocked(x, z)) {
              pos.set(x, 0, z); npc.root.rotation.y = Math.atan2(dx, dz);
              npc.legs.forEach((leg, i) => leg.rotation.x = Math.sin(npc.phase * 8 + i * Math.PI) * .35);
              npc.arms.forEach((arm, i) => arm.rotation.x = -Math.sin(npc.phase * 8 + i * Math.PI) * .25);
              npc.blocked = 0;
              if (distance <= step + .001) { npc.path.shift(); if (!npc.path.length) npc.wait = 5; }
            } else {
              npc.legs.forEach(leg => leg.rotation.x = 0);
              npc.blocked = (npc.blocked || 0) + dt;
              if (npc.blocked > 2) { npc.path = []; npc.wait = 1; npc.blocked = 0; }
            }
          } else {
            npc.legs.forEach(leg => leg.rotation.x = 0);
            if (npc.task) {
              const target = byId[npc.task.id].g.position;
              npc.root.rotation.y = Math.atan2(target.x - pos.x, target.z - pos.z);
              npc.arms.forEach((arm, i) => {
                arm.rotation.x = npc.task.action === 'books' ? -.95 + Math.sin(t * .002 + i) * .15 : -.65 + Math.sin(t * .006 + i * Math.PI) * .09;
              });
            }
            npc.wait -= dt;
            if (npc.wait <= 0) { planNpcTask(npc); npc.wait = 4; }
          }
          npc.head.rotation.y = Math.sin(t * .00065 + npc.taskIndex) * .1;
        }
      }
      function setupPlane(o) { if (o.kind === 'wallBack') plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, o.g.position.z)); else if (o.kind === 'wallLeft') plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(1, 0, 0), new THREE.Vector3(o.g.position.x, 0, 0)); else plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, o.g.position.y, 0)) }
      let walkTarget = null;
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      let tapOrigin = null, tapMoved = false, pinchDistance = 0;
      const touches = new Map(), canvas = renderer.domElement;
      function activateAt(e) {
        // Considera somente objetos que aparecem antes do piso no raio.
        point(e);
        const ground = ray.ray.intersectPlane(floorPlane, new THREE.Vector3());
        const hits = ray.intersectObjects(objects.map(o => o.g), true);
        const visibleHit = hits.find(h => !ground || h.distance < ray.ray.origin.distanceTo(ground) + .02);
        let node = visibleHit?.object;
        while (node && !node.userData.id) node = node.parent;
        const o = node ? byId[node.userData.id] : null;
        if (!o) {
          point(e);
          const destination = new THREE.Vector3();
          if (ray.ray.intersectPlane(floorPlane, destination) && !avatarBlocked(destination.x, destination.z)) {
            stopInteraction();
            keys.clear();
            walkTarget = destination;
          }
          return;
        }
        walkTarget = null;
        keys.clear();
        if (monitorVideos[o.id] && monitorVideos[o.id].contentKind !== 'default') showMonitorPreview(o.id);
        else if (o.id === 'cadeira') startInteraction('sit');
        else if (o.id === 'teclado') startInteraction('typing');
        else if (o.id === 'mouse') startInteraction('mouse');
        else show(o);
      }
      function fingerDistance() {
        const [a, b] = [...touches.values()];
        return Math.hypot(a.x - b.x, a.y - b.y);
      }
      canvas.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'touch') return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        canvas.setPointerCapture(e.pointerId);
        if (touches.size > 1) { release(); pinchDistance = fingerDistance(); }
      });
      canvas.addEventListener('pointermove', e => {
        if (!touches.has(e.pointerId)) return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size > 1) {
          const distance = fingerDistance();
          if (pinchDistance > 0) zoom = THREE.MathUtils.clamp(zoom * distance / pinchDistance, .6, 2.5);
          pinchDistance = distance; cameraUpdate();
        }
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, e => {
        touches.delete(e.pointerId); pinchDistance = 0;
      }));
      renderer.domElement.addEventListener('pointerdown', e => { if (e.button !== 0 || touches.size > 1) return; tapOrigin = { x: e.clientX, y: e.clientY }; tapMoved = false; oldY = e.clientY; oldX = e.clientX; if (edit) { const o = target(e); if (o) { select(o); setupPlane(o); point(e); if (ray.ray.intersectPlane(plane, hit)) { offset.copy(o.g.position).sub(hit); dragging = true; renderer.domElement.setPointerCapture(e.pointerId) } } } else { camDrag = true; renderer.domElement.setPointerCapture(e.pointerId) } }); renderer.domElement.addEventListener('pointermove', e => { if (touches.size > 1) return; if (tapOrigin && Math.hypot(e.clientX - tapOrigin.x, e.clientY - tapOrigin.y) > 6) tapMoved = true; if (!tapMoved) return; if (edit && dragging && selected) { point(e); if (ray.ray.intersectPlane(plane, hit)) { const p = hit.clone().add(offset); if (selected.kind === 'wallBack') { selected.g.position.x = THREE.MathUtils.clamp(p.x, -4, 4); selected.g.position.y = THREE.MathUtils.clamp(p.y, .6, 2.7) } else if (selected.kind === 'wallLeft') { selected.g.position.z = THREE.MathUtils.clamp(p.z, -3, 3); selected.g.position.y = THREE.MathUtils.clamp(p.y, 1.2, 2) } else { moveSafe(selected, new THREE.Vector3(p.x, selected.g.position.y, p.z)) } } } else if (camDrag) { yaw += (e.clientX - oldX) * .006; pitch = THREE.MathUtils.clamp(pitch + (e.clientY - oldY) * .005, .15, 1.45); oldX = e.clientX; oldY = e.clientY; cameraUpdate() } }); function release(e) { if (e && e.type === 'pointerup' && e.pointerType !== 'mouse' && tapOrigin && !tapMoved && !edit) activateAt(e); tapOrigin = null; const wasDragging = dragging; dragging = false; camDrag = false; if (wasDragging && edit) save() } renderer.domElement.addEventListener('pointerup', release); renderer.domElement.addEventListener('pointercancel', release); renderer.domElement.addEventListener('lostpointercapture', release); renderer.domElement.addEventListener('wheel', e => { e.preventDefault(); zoom = THREE.MathUtils.clamp(zoom - e.deltaY * .001, .6, 2.5); cameraUpdate() }, { passive: false });
      // O clique nativo do mouse ocorre depois do pointerup e da libera??o da captura.
      canvas.addEventListener('click', e => {
        if (e.pointerType === 'touch' || e.pointerType === 'pen' || edit || tapMoved) return;
        activateAt(e);
      });
      document.getElementById('edit').onclick = () => { edit = !edit; walkTarget = null; if (edit) stopInteraction(); release(); keys.clear(); document.getElementById('edit').textContent = edit ? '✓ Concluir organização' : 'Ativar modo construção'; document.getElementById('edit').classList.toggle('active', edit); document.getElementById('status').textContent = edit ? 'Modo construção ativo • alterações salvas automaticamente' : 'Explore o escritório.'; if (!edit) select(null) };
      function rotate(dir) { if (!selected || !edit || selected.kind.startsWith('wall')) return; if (moveSafe(selected, selected.g.position.clone(), selected.g.rotation.y + dir * Math.PI / 2)) save() } document.getElementById('left').onclick = () => rotate(-1); document.getElementById('right').onclick = () => rotate(1); height.addEventListener('input', () => { if (selected && edit && !selected.kind.startsWith('wall')) moveSafe(selected, new THREE.Vector3(selected.g.position.x, Number(height.value), selected.g.position.z)) }); height.addEventListener('change', () => { if (selected && edit && !selected.kind.startsWith('wall')) save() });
      const requestedOrganization = {
        mesa: [0, 0, -2.65, 0],
        monitor1: [-.85, 1.11, -2.75, 0],
        monitor2: [.73, 1.11, -2.75, 0],
        pc: [-1.89, 1.0975, -2.65, -Math.PI / 2],
        cadeira: [-.15, 0, -1.62, Math.PI],
        mousepad: [.3, 1.115, -2.43, 0],
        teclado: [-.15, 1.11715, -2.43, 0],
        mouse: [.85, 1.121, -2.43, 0],
        estante: [-4.02, 0, 2.3, Math.PI / 2],
        tv: [3.15, 1.9, -3.34, 0],
        quadro1: [-.95, 2.45, -3.35, 0],
        quadro2: [-.02, 2.45, -3.35, 0],
        quadro3: [.92, 2.45, -3.35, 0]
      };
      for (const [id, position] of Object.entries(requestedOrganization)) {
        const object = byId[id];
        object.initial = [...position];
        object.g.position.set(...position.slice(0, 3));
        object.g.rotation.y = position[3];
      }
      const storage = 'codejohn.homelab.layout.v13.collisions', previousStorages = ['codejohn.homelab.layout.v12.collisions', 'codejohn.homelab.layout.v11.collisions', 'codejohn.homelab.layout.v10.collisions', 'codejohn.homelab.layout.v9.collisions', 'codejohn.homelab.layout.v8.collisions', 'codejohn.homelab.layout.v7.collisions', 'codejohn.homelab.layout.v6.collisions', 'codejohn.homelab.layout.v5.collisions', 'codejohn.homelab.layout.v4.collisions', 'codejohn.homelab.layout.v3.collisions'];
      const wallMaterials = { back: backWall.material, left: leftWall.material, front: frontWall.material, right: rightWall.material };
      const wallSide = document.getElementById('wallSide'), wallColor = document.getElementById('wallColor');
      function syncWallColor() {
        wallColor.value = '#' + wallMaterials[wallSide.value === 'both' ? 'back' : wallSide.value].color.getHexString();
      }
      wallSide.addEventListener('change', syncWallColor);
      wallColor.addEventListener('input', () => {
        for (const [side, material] of Object.entries(wallMaterials)) {
          if (wallSide.value === 'both' || wallSide.value === side) material.color.set(wallColor.value);
        }
      });
      wallColor.addEventListener('change', save);
      document.getElementById('resetWallPaint').onclick = () => {
        Object.values(wallMaterials).forEach(material => material.color.set('#a5adb4'));
        syncWallColor(); save();
      };
      function save() {
        const data = { wallPaint: Object.fromEntries(Object.entries(wallMaterials).map(([side, material]) => [side, '#' + material.color.getHexString()])) };
        for (const o of objects) {
          data[o.id] = { p: o.g.position.toArray(), r: o.g.rotation.y };
          if (pictureImages[o.id]) data[o.id].image = pictureImages[o.id];
        }
        try {
          localStorage.setItem(storage, JSON.stringify(data));
          document.getElementById('status').textContent = 'Organização salva neste navegador!';
        } catch (error) {
          console.error('Não foi possível salvar a organização.', error);
          document.getElementById('status').textContent = 'Não foi possível salvar. O armazenamento do navegador pode estar cheio.';
        }
      }
      document.getElementById('save').onclick = save;
      document.getElementById('reset').onclick = () => {
        if (!confirm('Restaurar posições originais e remover imagens personalizadas dos quadros?')) return;
        for (const o of objects) { o.g.position.set(...o.initial.slice(0, 3)); o.g.rotation.y = o.initial[3] }
        for (const id of Object.keys(pictureImages)) {
          delete pictureImages[id];
          loadDefaultPicture(id);
        }
        select(null);
        save();
      };
      let migratingOldLayout = false;
      try {
        const currentSaved = localStorage.getItem(storage);
        migratingOldLayout = currentSaved === null;
        const saved = JSON.parse(currentSaved || previousStorages.map(key => localStorage.getItem(key)).find(Boolean) || '{}');
        for (const [side, material] of Object.entries(wallMaterials)) {
          const color = saved.wallPaint?.[side];
          if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) material.color.set(color);
        }
        syncWallColor();
        for (const o of objects) {
          const s = saved[o.id];
          const oldDefaultChairPosition = o.id === 'cadeira' && Array.isArray(s?.p) &&
            Math.abs(s.p[2] + 1.05) < .001 && (Math.abs(s.p[0] - .55) < .001 || Math.abs(s.p[0] - 1.1) < .001) &&
            (!Number.isFinite(s.r) || Math.abs(s.r) < .001);
          if (s && !(migratingOldLayout && o.id === 'quadro3') && !oldDefaultChairPosition && Array.isArray(s.p) && s.p.length === 3 && s.p.every(Number.isFinite)) {
            o.g.position.fromArray(s.p);
            o.g.rotation.y = Number.isFinite(s.r) ? s.r : 0;
          }
          let savedImage = s?.image;
          if (typeof savedImage !== 'string' || !savedImage.startsWith('data:image/')) {
            for (const key of previousStorages) {
              const previous = localStorage.getItem(key);
              if (!previous) continue;
              const previousImage = JSON.parse(previous)?.[o.id]?.image;
              if (typeof previousImage === 'string' && previousImage.startsWith('data:image/')) {
                savedImage = previousImage;
                break;
              }
            }
          }
          if (s && pictureFrames[o.id] && typeof savedImage === 'string' && savedImage.startsWith('data:image/')) {
            pictureImages[o.id] = savedImage;
            new THREE.TextureLoader().load(savedImage, texture => {
              if (pictureImages[o.id] !== savedImage) { texture.dispose(); return }
              setPictureTexture(o.id, texture);
            }, undefined, error => {
              if (pictureImages[o.id] !== savedImage) return;
              console.error('Não foi possível restaurar a imagem do quadro ' + o.label, error);
              pictureStatus.textContent = 'Não foi possível restaurar uma imagem salva do quadro.';
            });
          }
        }
      } catch (e) { console.warn('Layout salvo inválido', e) }
      if (migratingOldLayout) {
        for (const [id, position] of Object.entries(requestedOrganization)) {
          const object = byId[id];
          object.g.position.set(...position.slice(0, 3));
          object.g.rotation.y = position[3];
        }
        save();
      }
      addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (e.repeat) return;
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
        if (edit) return;
        if (k === 'e') {
          walkTarget = null;
          if (interactionPose) stopInteraction();
          else if (near?.id === 'cadeira') startInteraction('sit');
          else if (near?.id === 'teclado') startInteraction('typing');
          else if (near?.id === 'mouse') startInteraction('mouse');
          else if (near) show(near);
          return;
        }
        if (k === ' ' && interactionPose === 'sit') {
          e.preventDefault();
          startInteraction('typing');
          return;
        }
        if (k === 'm' && (interactionPose === 'sit' || interactionPose === 'typing')) {
          startInteraction('mouse');
          return;
        }
        if (!interactionPose) keys.add(k);
      });
      addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
      addEventListener('blur', () => keys.clear());
      document.querySelectorAll('[data-key]').forEach(b => {
        const k = b.dataset.key;
        b.addEventListener('pointerdown', e => { e.preventDefault(); if (!interactionPose) keys.add(k); b.setPointerCapture(e.pointerId) });
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => b.addEventListener(type, () => keys.delete(k)));
      });
      function show(o) { document.getElementById('dt').textContent = o.label; document.getElementById('dd').textContent = o.desc; document.getElementById('dialog').style.display = 'flex'; keys.clear() }
      document.getElementById('close').onclick = () => document.getElementById('dialog').style.display = 'none';
      document.getElementById('dialog').onclick = e => { if (e.target.id === 'dialog') e.currentTarget.style.display = 'none' };
      let prev = performance.now(), walk = 0;
      function loop(t) {
        requestAnimationFrame(loop);
        const dt = Math.min((t - prev) / 1000, .05);
        prev = t;
        if (!edit && document.getElementById('dialog').style.display !== 'flex' && !interactionPose) {
          let dx = 0, dz = 0;
          if (keys.has('w') || keys.has('arrowup')) dz--;
          if (keys.has('s') || keys.has('arrowdown')) dz++;
          if (keys.has('a') || keys.has('arrowleft')) dx--;
          if (keys.has('d') || keys.has('arrowright')) dx++;
          if (dx || dz) walkTarget = null;
          let step = dt * 2.3;
          if (walkTarget) {
            dx = walkTarget.x - avatar.position.x;
            dz = walkTarget.z - avatar.position.z;
            const remaining = Math.hypot(dx, dz);
            step = Math.min(step, remaining);
            if (remaining < .025) { walkTarget = null; dx = 0; dz = 0; }
          }
          const len = Math.hypot(dx, dz);
          if (len) {
            dx /= len; dz /= len;
            const previousX = avatar.position.x, previousZ = avatar.position.z;
            const nx = previousX + dx * step, nz = previousZ + dz * step;
            if (!avatarBlocked(nx, avatar.position.z)) avatar.position.x = nx;
            if (!avatarBlocked(avatar.position.x, nz)) avatar.position.z = nz;
            if (walkTarget && avatar.position.x === previousX && avatar.position.z === previousZ) walkTarget = null;
            avatar.rotation.y = Math.atan2(dx, dz);
            walk += dt * 11;
            legs.forEach((leg, i) => leg.rotation.x = Math.sin(walk + i * Math.PI) * .5);
            knees.forEach((knee, i) => knee.rotation.x = Math.max(0, Math.sin(walk + i * Math.PI)) * .45);
            arms.forEach((arm, i) => arm.rotation.x = -Math.sin(walk + i * Math.PI) * .35);
            elbows.forEach((elbow, i) => elbow.rotation.x = -.12 - Math.sin(walk + i * Math.PI) * .18);
          } else {
            legs.forEach(leg => leg.rotation.set(0, 0, 0));
            knees.forEach(knee => knee.rotation.set(0, 0, 0));
            arms.forEach(arm => arm.rotation.set(0, 0, 0));
            elbows.forEach(elbow => elbow.rotation.set(0, 0, 0));
          }
        }
        if (interactionPose) {
          interactionTime += dt;
          if (interactionPose === 'typing') {
            arms.forEach((arm, i) => {
              arm.rotation.x = -.65 + Math.sin(interactionTime * 12 + i * Math.PI) * .018;
              arm.rotation.z = Math.sin(interactionTime * 12 + i * Math.PI) * .025;
            });
            elbows.forEach((elbow, i) => {
              elbow.rotation.x = Math.sin(interactionTime * 12 + i * Math.PI) * .025;
              elbow.rotation.z = 0;
            });
          } else if (interactionPose === 'mouse') {
            arms[0].rotation.set(-.6 + Math.sin(interactionTime * 3) * .02, 0, .06);
            arms[1].rotation.set(-.65, 0, 0);
            elbows[0].rotation.set(0, 0, -.04 + Math.sin(interactionTime * 5) * .02);
            elbows[1].rotation.set(0, 0, 0);
          }
        }
        near = null;
        let best = 1.6;
        for (const o of objects) {
          const d = Math.hypot(avatar.position.x - o.g.position.x, avatar.position.z - o.g.position.z);
          if (d < best) { best = d; near = o }
        }
        if (!edit && !interactionPose) document.getElementById('status').textContent = near ? 'E para interagir: ' + near.label : 'Explore o escritório.';
        animatedPcFans.forEach((fan, i) => { fan.rotation.z += dt * (i % 2 ? 5.2 : -5.2) });
        refreshRoomColliders();
        updateNpcs(dt, t);
        paintScreens();
        renderer.render(scene, camera);
        renderMonitorVideos();
      }
      requestAnimationFrame(loop);
    } catch (e) { fail(e) }
