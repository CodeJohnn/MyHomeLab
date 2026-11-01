    const errorBox = document.getElementById('error'); function fail(e) { errorBox.style.display = 'block'; errorBox.textContent = 'Falha ao iniciar o cenário 3D: ' + (e?.message || e) + '\nAbra com Live Server e confira a conexão com a internet.'; console.error(e) } window.addEventListener('error', e => fail(e.error || e.message)); window.addEventListener('unhandledrejection', e => fail(e.reason));
    try {
      const { createInteractionAudio } = await import('./interaction-audio.mjs?v=3');
      const interactionAudio=createInteractionAudio();
      const { guedesConversations } = await import('./guedessec-dialogue.mjs?v=2');
      const { naturalNpcText } = await import('./npc-portuguese.mjs?v=1');
      const { daylightAt, saoPauloTime } = await import('./daylight.mjs?v=1');
      const { createNpcVoices } = await import('./npc-voices.mjs?v=7');
      const { createRoomAudio } = await import('./room-audio.mjs?v=4');
      const { createAdminTerminal } = await import('./admin-terminal.mjs?v=2');
      const { normalizeMonitorUrl, embeddedMonitorUrl } = await import('./monitor-urls.mjs?v=3');
      const { replyToNpc } = await import('./npc-dialogue.mjs?v=5');
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
      const { RoundedBoxGeometry } = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/geometries/RoundedBoxGeometry.js');
      const { CSS3DRenderer, CSS3DObject } = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/renderers/CSS3DRenderer.js');
      const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth <= 700;
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#101923'); const camera = new THREE.OrthographicCamera(-8, 8, 5, -5, .1, 100); const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.75 : 2)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.4; document.body.prepend(renderer.domElement);
      const skyLight=new THREE.HemisphereLight(0xe3f4ff,0x6c554b,2.3);scene.add(skyLight); const sun = new THREE.DirectionalLight(0xfff3dc, 3.3); sun.position.set(-4, 11, 7); sun.castShadow = true; sun.shadow.mapSize.set(isMobile ? 768 : 2048, isMobile ? 768 : 2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); scene.add(sun);
      const M = (c, metalness = 0, roughness = .72) => new THREE.MeshStandardMaterial({ color: c, metalness, roughness }); const wood = M('#a97b58'), woodLight = M('#c49b75'), black = M('#151d25', .2, .42), metal = M('#39434b', .65, .35), wall = M('#bdc1c5'), tile = M('#98765c'), white = M('#dce5e7'), blue = M('#2daaff'), glass = new THREE.MeshPhysicalMaterial({ color: '#294b62', metalness: .12, roughness: .14, transparent: true, opacity: .7 }); const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
      function box(g, w, h, d, m, x = 0, y = 0, z = 0, r = 0) { const geo = r ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)) : new THREE.BoxGeometry(w, h, d); const a = new THREE.Mesh(geo, m); a.position.set(x, y, z); a.castShadow = true; a.receiveShadow = true; g.add(a); return a } function cyl(g, r, h, m, x, y, z, segments = 24) { const a = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), m); a.position.set(x, y, z); a.castShadow = true; g.add(a); return a } function sphere(g, r, m, x, y, z) { const a = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), m); a.position.set(x, y, z); a.castShadow = true; g.add(a); return a }
      // Fundo ilustrado a partir da referencia, independente da camera do quarto.
      const cityBackground = new THREE.TextureLoader().load(new URL('../assets/city-backdrop.png', import.meta.url).href, texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
        fitCityBackground();
      });
      function fitCityBackground() {
        if (!cityBackground.image) return;
        const imageAspect = cityBackground.image.width / cityBackground.image.height;
        const viewAspect = innerWidth / innerHeight;
        const repeatX = Math.min(1, viewAspect / imageAspect);
        const repeatY = Math.min(1, imageAspect / viewAspect);
        cityBackground.repeat.set(repeatX, repeatY);
        cityBackground.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);
      }
      addEventListener('resize', fitCityBackground);
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
      // Estrutura real sob o quarto, alinhada ao perimetro do piso.
      const buildingBase = new THREE.Group(); scene.add(buildingBase);
      const buildingConcrete = M('#9b9e9a', .08, .88), buildingEdge = M('#c4c2b5', .05, .8);
      box(buildingBase, 9.35, .2, 7.35, buildingEdge, 0, -.32, 0, .025);
      const baseCanvas = document.createElement('canvas'); baseCanvas.width = 512; baseCanvas.height = 512;
      const baseContext = baseCanvas.getContext('2d');
      baseContext.fillStyle = '#7b8587'; baseContext.fillRect(0,0,512,512);
      for (let row=0;row<4;row++) {
        baseContext.fillStyle='#b1b2aa'; baseContext.fillRect(0,row*128,512,14);
        for (let col=0;col<6;col++) {
          const x=col*85+14, y=row*128+32;
          baseContext.fillStyle='#525e64'; baseContext.fillRect(x-4,y-4,61,75);
          baseContext.fillStyle=(row+col)%7===0?'#b1b69b':'#3c6370'; baseContext.fillRect(x,y,53,67);
          baseContext.fillStyle='#a5c4cb40'; baseContext.fillRect(x+4,y+3,14,58);
          baseContext.fillStyle='#87979a'; baseContext.fillRect(x+25,y,3,67); baseContext.fillRect(x,y+32,53,3);
        }
      }
      const baseTexture = new THREE.CanvasTexture(baseCanvas); baseTexture.colorSpace = THREE.SRGBColorSpace;
      baseTexture.wrapS = baseTexture.wrapT = THREE.RepeatWrapping; baseTexture.repeat.set(1,2.5);
      baseTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const buildingFacade = new THREE.MeshStandardMaterial({ map: baseTexture, roughness:.85 });
      const baseTower = new THREE.Mesh(new THREE.BoxGeometry(9,18,7),[buildingFacade,buildingFacade,buildingConcrete,buildingConcrete,buildingFacade,buildingFacade]);
      baseTower.position.y=-9.43; baseTower.receiveShadow=true; buildingBase.add(baseTower);
      for (const x of [-4.49,4.49]) for (const z of [-3.49,3.49]) box(buildingBase,.1,18,.1,buildingConcrete,x,-9.43,z);
      box(scene, 9, .24, 7, tile, 0, -.13, 0);
      const grout = M('#775b48');
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
      const rightWall = roomWall('right', .14, 7, 9.5, 0, 1, 0);
      const apartmentWalls = [];
      function partition(parent, w, h, d, x, y, z, material = wall) {
        if(material === wall) material = parent.children.find(child => child.isMesh)?.material || wall;
        if(w<=.15)w=.14;
        if(d<=.15)d=.14;
        const mesh=box(parent,w,h,d,material,x,y,z);apartmentWalls.push(mesh);
        if(Math.abs(y+h/2-3.3)<.01)box(parent,w+.04,.1,d+.04,white,x,3.3,z);
        return mesh;
      }
      box(scene,5,.24,7,M('#b69d7e'),7,-.13,0);
      box(buildingBase,5.15,.2,7.35,buildingEdge,7,-.32,0);
      const annexTower = new THREE.Mesh(new THREE.BoxGeometry(5,18,7),[buildingFacade,buildingFacade,buildingConcrete,buildingConcrete,buildingFacade,buildingFacade]);
      annexTower.position.set(7,-9.43,0); buildingBase.add(annexTower);
      partition(roomWalls.back.group,5,3.3,.14,7,1.65,-3.5);
      partition(roomWalls.front.group,5,3.3,.14,7,1.65,3.5);
      // Divisoria entre laboratorio e novos ambientes, com duas passagens abertas.
      for (const [z,length] of [[-2.95,1.1],[0,2.6],[2.95,1.1]]) partition(roomWalls.right.group,.14,3.3,length,4.5,1.65,z);
      for (const z of [-1.85,1.85]) {
        partition(roomWalls.right.group,.14,.85,1.1,4.5,2.875,z);
        for(const edge of [-.55,.55]) box(roomWalls.right.group,.18,2.45,.055,woodLight,4.5,1.225,z+edge);
      }
      partition(roomWalls.front.group,5,3.3,.12,7,1.65,0);
      const guedesTv = new THREE.Group();
      guedesTv.position.set(4.34, 2.05, 0);
      guedesTv.userData.screenOwner=true;guedesTv.userData.wallAttachment=true;
      guedesTv.rotation.y = -Math.PI / 2;
      roomWalls.right.group.add(guedesTv);
      box(guedesTv, 2.12, 1.32, .12, M('#101820', .55, .3), 0, 0, 0, .045);
      box(guedesTv, 2.02, 1.22, .025, M('#34434b', .5, .35), 0, 0, .066, .025);
      const guedesTvScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.94, 1.12),
        new THREE.MeshBasicMaterial({ color: '#080f14', toneMapped: false })
      );
      guedesTvScreen.position.z = .082;
      guedesTv.add(guedesTvScreen);
      box(guedesTv, .22, .018, .012, glow('#55e6a4'), 0, -.62, .069, .004);
      const ambientSpeaker=new THREE.Group();
      ambientSpeaker.position.set(0,-.94,.035);guedesTv.add(ambientSpeaker);
      const speakerBody=M('#17212a',.3,.65),speakerCone=M('#303e49');
      box(ambientSpeaker,1.18,.24,.18,speakerBody,0,0,0,.035);
      for(const x of [-.40,.40]){
        const cone=cyl(ambientSpeaker,.076,.012,speakerCone,x,0,.098);cone.rotation.x=Math.PI/2;
        sphere(ambientSpeaker,.029,M('#11171c'),x,0,.11);
      }
      box(ambientSpeaker,.09,.008,.006,glow('#68c3cf'),0,-.075,.096,.002);
      function isSceneVisible(object) {
        for (let node = object; node; node = node.parent) if (!node.visible) return false;
        return true;
      }

      const objects = [], byId = {}; function item(id, label, kind, x, y, z, desc) { const g = new THREE.Group(); g.position.set(x, y, z); g.userData.id = id; scene.add(g); const o = { id, label, kind, g, desc, baseY: y, initial: [x, y, z, 0] }; objects.push(o); byId[id] = o; return g }
      // Mobilia dos novos comodos, editavel pelo organizador.
      const rackBlack=M('#18242d',.5,.4), rackSteel=M('#607681',.65,.35);
      const serverIndicators=[];
      function serverCabinet(id,label,x,z,units) {
        const rack=item(id,label,'floor',x,0,z,'Servidor com painel de status, discos, LEDs de atividade e conexoes traseiras.');
        box(rack,1.05,2.5,.85,rackBlack,0,1.25,0,.035);
        for(const x of [-.46,.46])box(rack,.035,2.4,.035,rackSteel,x,1.25,.445);
        for(let row=0;row<4;row++) {
          const y=.32+row*.32;
          box(rack,.86,.25,.035,metal,0,y,.45,.01);
          for(let vent=0;vent<8;vent++)box(rack,.035,.13,.008,black,-.34+vent*.075,y,.475);
          const led=sphere(rack,.016,glow('#65f5a9'),.35,y+.06,.484);
          serverIndicators.push({mesh:led,phase:serverIndicators.length*.7});
        }
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#071924';ctx.fillRect(0,0,512,256);
        ctx.fillStyle='#75e7cd';ctx.font='bold 27px monospace';ctx.fillText(label.replace('Rack ','').toUpperCase(),20,40,470);
        ctx.font='22px monospace';ctx.fillText('SYSTEM ONLINE',20,88);ctx.fillText('CPU  24%   RAM  38%',20,124);ctx.fillText('NETWORK / CONNECTED',20,160);
        for(let j=0;j<17;j++){ctx.fillStyle=j<11?'#55c6b5':'#203642';ctx.fillRect(20+j*27,192,19,26);}
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
        box(rack,.9,.52,.04,black,0,1.87,.456,.018);
        const display=new THREE.Mesh(new THREE.PlaneGeometry(.79,.395),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));display.position.set(0,1.87,.48);rack.add(display);
        box(rack,.88,.18,.025,black,0,2.25,-.438,.004);
        for(let port=0;port<12;port++) {
          box(rack,.046,.045,.012,rackSteel,-.38+port*.068,2.25,-.457,.002);
          box(rack,.028,.025,.014,black,-.38+port*.068,2.25,-.465,.001);
        }
        rack.userData.statusDisplay={ctx,texture,label};
        const beacon=sphere(rack,.055,glow('#21352b'),0,2.59,0);rack.userData.beacon=beacon;
        return rack;
      }
      serverCabinet('bancadaTI','Rack computacao',5.2,-2.85,4);
      serverCabinet('instrumentosTI','Rack backup',6.4,-2.85,4);
      serverCabinet('rackExtraTI','Rack virtualizacao',7.6,-2.85,4);
      serverCabinet('pecasTI','Rack rede',8.8,-2.85,4);
      const consoleDesk=item('banquetaTI','Console de administracao','floor',5.3,0,-.9,'Terminal de administracao da sala de servidores.');
      box(consoleDesk,1.75,.1,.72,woodLight,0,.96,0,.015);
      for(const x of [-.75,.75])box(consoleDesk,.055,.91,.48,metal,x,.455,0);
      box(consoleDesk,.74,.48,.06,black,-.4,1.32,-.13,.012);
      const adminScreenCanvas=document.createElement('canvas');adminScreenCanvas.width=800;adminScreenCanvas.height=480;
      const adminScreenContext=adminScreenCanvas.getContext('2d');adminScreenContext.fillStyle='#0b1018';adminScreenContext.fillRect(0,0,800,480);
      adminScreenContext.fillStyle='#1d2836';adminScreenContext.fillRect(0,0,800,48);adminScreenContext.fillStyle='#bdcbdc';adminScreenContext.font='22px monospace';adminScreenContext.fillText('admin@guedessec: ~',25,32);
      adminScreenContext.font='21px monospace';
      ['GuedesSEC / console de administracao','','> status','  4 racks disponiveis no cenario','  rede local configurada','','> help','  Clique para abrir o terminal','','admin@homelab:~ > _'].forEach((line,i)=>{adminScreenContext.fillStyle=line.startsWith('>')?'#9ebfe3':'#94a4b8';adminScreenContext.fillText(line,28,94+i*34);});
      const adminScreenTexture=new THREE.CanvasTexture(adminScreenCanvas);adminScreenTexture.colorSpace=THREE.SRGBColorSpace;
      const adminScreen=new THREE.Mesh(new THREE.PlaneGeometry(.67,.4),new THREE.MeshBasicMaterial({map:adminScreenTexture,toneMapped:false}));adminScreen.position.set(-.4,1.32,-.092);consoleDesk.add(adminScreen);
      box(consoleDesk,.53,.025,.18,black,0,1.03,.13,.005);
      box(consoleDesk,.78,.51,.065,black,.42,1.34,-.14,.015);
      cyl(consoleDesk,.018,.18,metal,.42,1.07,-.14);box(consoleDesk,.28,.025,.18,black,.42,1.005,-.12,.005);
      const monitoringCanvas=document.createElement('canvas');monitoringCanvas.width=1024;monitoringCanvas.height=640;
      const monitoringTexture=new THREE.CanvasTexture(monitoringCanvas);monitoringTexture.colorSpace=THREE.SRGBColorSpace;monitoringTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
      const monitoringDisplay=new THREE.Mesh(new THREE.PlaneGeometry(.71,.444),new THREE.MeshBasicMaterial({map:monitoringTexture,toneMapped:false}));monitoringDisplay.position.set(.42,1.34,-.101);consoleDesk.add(monitoringDisplay);
      let monitoringTick=-1,monitoringFps=60;
      function updateMonitoring(time,dt) {
        monitoringFps+=(1/Math.max(dt,.001)-monitoringFps)*.05;
        const tick=Math.floor(time/500);if(tick===monitoringTick)return;monitoringTick=tick;
        const ctx=monitoringCanvas.getContext('2d');ctx.fillStyle='#08131d';ctx.fillRect(0,0,1024,640);
        ctx.fillStyle='#152b38';ctx.fillRect(0,0,1024,70);ctx.fillStyle='#8de4c1';ctx.font='bold 27px monospace';ctx.fillText('GUEDESSEC / MONITORAMENTO',30,44);
        ctx.fillStyle='#9eb9c7';ctx.font='18px monospace';ctx.fillText('CENARIO 3D / NAO CONECTADO A SERVIDORES REAIS',30,105);
        const metrics=[['FPS',Math.round(monitoringFps)],['NPCs',npcs.length],['TELAS ATIVAS',[...playableScreens.values()].filter(m=>m.contentKind!=='default').length]];
        metrics.forEach(([label,value],i)=>{const x=30+i*330;ctx.fillStyle='#112735';ctx.fillRect(x,130,304,100);ctx.fillStyle='#87a4b7';ctx.font='20px monospace';ctx.fillText(label,x+20,160);ctx.fillStyle='#79dbb5';ctx.font='bold 36px monospace';ctx.fillText(String(value),x+20,205);});
        ctx.font='22px monospace';ctx.fillStyle='#e2edef';ctx.fillText('RACKS DO LABORATORIO',30,280);
        ['bancadaTI','instrumentosTI','rackExtraTI','pecasTI'].forEach((id,i)=>{const y=325+i*46;ctx.fillStyle='#6bd8ac';ctx.beginPath();ctx.arc(42,y-6,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bdd1dc';ctx.fillText(byId[id].label,65,y);ctx.fillStyle='#7daca6';ctx.fillText('NO CENARIO',770,y);});
        ctx.fillStyle='#66899c';ctx.font='18px monospace';ctx.fillText('REDE: MODEM > RACK REDE > ESTACOES',30,548);ctx.fillText('Atualizado '+new Date().toLocaleTimeString('pt-BR'),30,605);monitoringTexture.needsUpdate=true;
      }
      const toilet=item('vaso','Vaso sanitario','floor',8.75,0,.85,'Vaso sanitario de porcelana.');
      cyl(toilet,.23,.38,white,0,.22,0);box(toilet,.48,.16,.65,white,0,.48,.1,.07);box(toilet,.5,.65,.2,white,0,.57,-.25,.04);
      const sink=item('piaBanheiro','Pia do banheiro','floor',5.45,0,.7,'Bancada com cuba e torneira.');
      box(sink,1.25,.78,.6,woodLight,0,.39,0,.03);box(sink,1.35,.1,.7,white,0,.83,0,.03);box(sink,.6,.025,.36,M('#8aa5aa'),0,.89,.02,.04);cyl(sink,.025,.24,metal,0,1,-.18);
      const shower=item('chuveiro','Box e chuveiro','floor',8.45,0,2.6,'Box de banho com divisoria de vidro.');
      box(shower,1.7,.1,1.5,white,0,.05,0,.03);box(shower,1.7,2,.025,glass,0,1.1,-.72);cyl(shower,.02,1.9,metal,.62,1.05,.56);cyl(shower,.15,.04,metal,.62,2.04,.4);
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
        const rotor = new THREE.Group(); rotor.userData.isPcFan = true; if (axis === 'x') rotor.rotation.y = Math.PI / 2; mount.add(rotor);
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
      const gpuLabelCanvas = document.createElement('canvas'); gpuLabelCanvas.width = 1024; gpuLabelCanvas.height = 320;
      const gpuCtx = gpuLabelCanvas.getContext('2d');
      gpuCtx.fillStyle = '#111a22'; gpuCtx.fillRect(0, 0, 1024, 320);
      gpuCtx.fillStyle = '#76e143'; gpuCtx.fillRect(18, 20, 14, 280);
      gpuCtx.font = 'bold 148px Arial, sans-serif'; gpuCtx.fillStyle = '#f0f5f7'; gpuCtx.fillText('RTX 3060', 64, 194, 920);
      gpuCtx.font = 'bold 38px Arial, sans-serif'; gpuCtx.fillStyle = '#89a2b1'; gpuCtx.fillText('GEFORCE  •  12 GB', 68, 258, 900);
      const gpuLabelTex = new THREE.CanvasTexture(gpuLabelCanvas); gpuLabelTex.colorSpace = THREE.SRGBColorSpace;
      const gpuLabel = new THREE.Mesh(new THREE.PlaneGeometry(.68, .2125), new THREE.MeshBasicMaterial({ map: gpuLabelTex, side: THREE.DoubleSide, transparent: false, toneMapped: false }));
      gpuLabel.position.set(.335, .50, -.055); gpuLabel.rotation.y = Math.PI / 2; gpuVertical.add(gpuLabel);
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
      // Canto de leitura com madeira clara, metal grafite e iluminacao de tarefa.
      const readingOak=M('#b88c61',.04,.8), readingDark=M('#29383d',.25,.6), bookPaper=M('#e9dfca');
      g=item('bibliotecaNova','Estante do canto de leitura','floor',-4.04,0,1.6,'Estante com livros tecnicos, nichos decorativos e planta.');
      g.rotation.y=Math.PI/2;
      box(g,2.05,2.35,.065,readingDark,0,1.24,-.205,.008);
      for(const x of [-1,1])box(g,.065,2.45,.44,readingOak,x,1.225,0,.012);
      const bookPalette=['#426778','#b56b50','#b7a571','#51776c','#696782','#374c63'];
      for(let row=0;row<5;row++) {
        const y=.15+row*.53;box(g,2.05,.055,.45,readingOak,0,y,0,.009);
        if(row<4)for(let i=0;i<10;i++) {
          const x=-.87+i*.13,h=.25+(i*7%5)*.025;
          box(g,.09,h,.23,M(bookPalette[(i+row)%bookPalette.length]),x,y+.03+h/2,.015,.003);
          box(g,.065,.009,.007,bookPaper,x,y+.03+h*.72,.134,.001);
        }
      }
      box(g,.48,.28,.34,M('#a6b3a5'),.65,.32,0,.02);
      cyl(g,.105,.15,M('#d5c5b0'),.68,2.35,0);
      for(let i=0;i<6;i++) {const leaf=sphere(g,.075,M('#427359'),.68+Math.sin(i*2)*.09,2.51+i*.025,Math.cos(i*2)*.06);leaf.scale.set(.55,1.6,.7);}
      const readingDesk=item('mesaLeitura','Mesa de leitura','floor',-2.35,0,1.45,'Mesa com livro aberto, luminaria articulada, caderno e porta-lapis.');
      box(readingDesk,1.45,.075,.8,readingOak,0,.9,0,.03);
      for(const x of [-.59,.59])for(const z of [-.29,.29])box(readingDesk,.045,.86,.045,readingDark,x,.43,z,.005);
      box(readingDesk,1.15,.04,.055,readingDark,0,.23,-.29);
      const readingBook=new THREE.Group();readingBook.position.set(0,.95,.07);readingBook.rotation.y=-.14;readingDesk.add(readingBook);
      for(const side of [-1,1]) {const page=box(readingBook,.24,.025,.32,bookPaper,side*.119,.012,0,.003);page.rotation.z=side*.045;
        for(let line=0;line<9;line++)box(readingBook,.17,.001,.003,M('#8b887d'),side*.12,.028,-.11+line*.026);}
      box(readingDesk,.23,.025,.3,M('#547985'),.43,.954,-.07,.005);
      cyl(readingDesk,.063,.14,readingDark,.5,1.005,-.25);
      for(let i=0;i<5;i++){const pencil=box(readingDesk,.012,.21,.012,M(bookPalette[i]),.47+(i%3)*.025,1.13,-.27+Math.floor(i/3)*.03,.001);pencil.rotation.z=(i-2)*.06;}
      cyl(readingDesk,.115,.025,readingDark,-.5,.95,-.21);
      const lampJoint=new THREE.Group();lampJoint.position.set(-.5,.97,-.21);readingDesk.add(lampJoint);
      const lampArm=box(lampJoint,.025,.36,.025,readingDark,.04,.18,0,.004);lampArm.rotation.z=-.22;
      const lampUpper=box(lampJoint,.025,.27,.025,readingDark,.15,.4,0,.004);lampUpper.rotation.z=-.8;
      const shade=cyl(lampJoint,.11,.12,readingDark,.24,.49,0);shade.rotation.z=-.35;
      cyl(lampJoint,.085,.008,glow('#ffe4a0'),.24,.426,0);
      const readingLight=new THREE.PointLight('#ffe4b0',.7,2.2,2);readingLight.position.set(-.26,1.34,-.15);readingDesk.add(readingLight);
      const readingChair=item('cadeiraLeitura','Cadeira de leitura','floor',-2.35,0,2.28,'Cadeira estofada junto a mesa de leitura.');
      const upholstery=M('#426a65',.02,.95);
      box(readingChair,.55,.13,.53,upholstery,0,.49,0,.055);
      box(readingChair,.55,.55,.08,upholstery,0,.83,.25,.045);
      for(const x of [-.21,.21])for(const z of [-.2,.2])box(readingChair,.04,.43,.04,readingOak,x,.215,z,.006);
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
      // Bancada de eletrônica em L, com ferramentas integradas ao móvel.
      g = item('mesaL', 'Mesa em L com estação de solda', 'floor', 3.1, 0, -2.2, 'Bancada em L: estação de solda, suporte para ferro, carretel de estanho e placa em manutenção.');
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
      // Rack independente do servidor já existente.
      // Lousa com anotações desenhadas em alta resolução.
      g = item('lousa', 'Lousa branca de anotações', 'wallBack', -2.95, 2.4, -3.35, 'Planejamento do laboratório: rede, servidores, backups e manutenção eletrônica.');
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
      board.fillStyle='#27856c'; board.font='38px sans-serif'; board.fillText('Backup: diário   |   Rede: OK   |   Próxima tarefa: manutenção',65,710);
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
      function pictureCrop(source, maxWidth = 768, maxHeight = 1036) {
        const aspect = .55 / .74;
        const sourceAspect = source.width / source.height;
        const cropWidth = sourceAspect > aspect ? source.height * aspect : source.width;
        const cropHeight = sourceAspect > aspect ? source.height : source.width / aspect;
        const scale = Math.min(1, maxWidth / cropWidth, maxHeight / cropHeight);
        const width = Math.max(1, Math.round(cropWidth * scale));
        const height = Math.max(1, Math.round(cropHeight * scale));
        return {
          width, height,
          x: (source.width - cropWidth) / 2,
          y: (source.height - cropHeight) / 2,
          cropWidth, cropHeight
        };
      }
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
          const crop = pictureCrop(sourceImage);
          const canvas = document.createElement('canvas');
          canvas.width = crop.width;
          canvas.height = crop.height;
          const context = canvas.getContext('2d');
          if (!context) {
            console.error('Não foi possível preparar a imagem padrão do quadro ' + id + '.');
            pictureStatus.textContent = 'Não foi possível preparar uma imagem padrão do quadro.';
            return;
          }
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(sourceImage, crop.x, crop.y, crop.cropWidth, crop.cropHeight, 0, 0, canvas.width, canvas.height);
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
      const posterFrame = M('#171d23', .65, .32), posterTrim = M('#8c999f', .75, .28);
      // Moldura de aluminio com passe-partout e estampa em formato vertical.
      box(g,.085,2.16,1.74,posterFrame,0,0,0,.018);
      for(const z of [-.847,.847])box(g,.035,2.12,.028,posterTrim,.056,0,z,.004);
      for(const y of [-1.047,1.047])box(g,.035,.028,1.72,posterTrim,.056,y,0,.004);
      box(g,.014,2.01,1.59,M('#06090c'),.061,0,0,.005);
      const posterCanvas=document.createElement('canvas');posterCanvas.width=960;posterCanvas.height=1200;
      const posterContext=posterCanvas.getContext('2d');
      const posterTexture=new THREE.CanvasTexture(posterCanvas);posterTexture.colorSpace=THREE.SRGBColorSpace;
      posterTexture.anisotropy=renderer.capabilities.getMaxAnisotropy();
      const posterImage=new THREE.Mesh(new THREE.PlaneGeometry(1.51,1.89),new THREE.MeshBasicMaterial({map:posterTexture,toneMapped:false}));
      posterImage.rotation.y=Math.PI/2;posterImage.position.set(.073,0,0);g.add(posterImage);
      const guedesLogoUrl = new URL('../assets/guedessec.png?v=a55204d9b63d', import.meta.url).href;
      const guedesLogo = new Image();
      function paintPoster() {
        const context=posterContext;if(!context)return;
        context.clearRect(0,0,posterCanvas.width,posterCanvas.height);
        context.fillStyle='#000';context.fillRect(0,0,posterCanvas.width,posterCanvas.height);
        if(guedesLogo.complete && guedesLogo.naturalWidth) {
          const scale=Math.min(posterCanvas.width/guedesLogo.naturalWidth,posterCanvas.height/guedesLogo.naturalHeight);
          const width=guedesLogo.naturalWidth*scale,height=guedesLogo.naturalHeight*scale;
          context.drawImage(guedesLogo,(posterCanvas.width-width)/2,(posterCanvas.height-height)/2,width,height);
        }
        posterTexture.needsUpdate=true;
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
        const { ctx: t, canvas: tc } = terminal; t.fillStyle = '#07120f'; t.fillRect(0, 0, tc.width, tc.height); t.fillStyle = '#173f2d'; t.fillRect(0, 0, tc.width, 43); t.fillStyle = '#b9ffda'; t.font = 'bold 21px monospace'; t.fillText('●  ●  ●   ubuntu@bibliotecadealexandria: ~', 18, 29); t.font = '20px monospace'; const lines = ['// GuedesSEC - development', 'const lab = await connect();', 'async function deploy(service) {', '  const build = await compile(service);', '  if (build.ok) return lab.run(build);', '}', 'const status = await lab.health();', 'console.log(status);', '// watching changes...', '$ npm run dev', '$ git status', '// tests: passed', '$ _']; /* previous terminal: ['$ fastfetch', '  CodeJOHN • HOME LAB', '  OS: Ubuntu Server', '  Shell: bash', '  Services: Docker • Samba • Jellyfin', '  Network: LAN connected', '', '$ docker ps', '  casaos     running', '  jellyfin   running', '', '$ uptime', '  system online', '', '$ _']; */ lines.forEach((line, i) => { t.fillStyle = line.startsWith('$') ? '#70ffad' : '#b2c9c1'; t.fillText(line, 24, 83 + i * 30) }); t.fillStyle = '#42e29a'; t.fillRect(24, tc.height - 10, (frame * 2) % tc.width, 3); terminalTex.needsUpdate = true;
      }
      const defaultWebsiteUrl = 'https://guedessec.online/';
      const monitorVideos = {
        monitor1: { id: 'monitor1', video: document.createElement('video'), url: null, texture: null, websiteUrl: defaultWebsiteUrl, contentKind: 'website', status: document.getElementById('videoStatusLeft'), playButton: document.getElementById('playVideoLeft'), fileInput: document.getElementById('videoFileLeft'), websiteInput: document.getElementById('websiteUrlLeft'), websiteButton: document.getElementById('openWebsiteLeft'), websiteStatus: document.getElementById('websiteStatusLeft'), label: 'Monitor esquerdo', mesh: screenMeshes.monitor1, defaultMaterial: terminalMat, defaultLabel: 'Site GuedesSEC' },
        monitor2: { id: 'monitor2', video: document.createElement('video'), url: null, texture: null, websiteUrl: defaultWebsiteUrl, contentKind: 'website', status: document.getElementById('videoStatusRight'), playButton: document.getElementById('playVideoRight'), fileInput: document.getElementById('videoFileRight'), websiteInput: document.getElementById('websiteUrlRight'), websiteButton: document.getElementById('openWebsiteRight'), websiteStatus: document.getElementById('websiteStatusRight'), label: 'Monitor ultrawide', mesh: screenMeshes.monitor2, defaultMaterial: terminalMat, defaultLabel: 'Site GuedesSEC' }
      };
      // Exibe o próprio vídeo HTML no plano do monitor, sem reamostrar seus frames no WebGL.
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
      let lastMonitorOcclusionCheck = -Infinity;
      function renderMonitorVideos() {
        const checkOcclusion = !isMobile || performance.now() - lastMonitorOcclusionCheck >= 150;
        if (checkOcclusion) lastMonitorOcclusionCheck = performance.now();
        for (const monitor of playableScreens.values()) {
          if(monitor.localExpanded)continue;
          if(monitor.contentKind==='video' && monitor.url && !monitor.htmlScreen) {
            const size=monitor.mesh.geometry.parameters,video=monitor.video;
            video.style.cssText='width:1280px;object-fit:contain;background:#000;pointer-events:none;';video.style.height=(1280*size.height/size.width)+'px';
            monitor.htmlScreen=new CSS3DObject(video);monitor.htmlScreen.scale.setScalar(size.width/1280);videoScene.add(monitor.htmlScreen);
          }
          if(monitor.contentKind==='website' && monitor.websiteUrl && !monitor.websiteScreen) {
            const iframe=document.createElement('iframe');
            iframe.title='Site em '+monitor.label;iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allow='fullscreen; autoplay; encrypted-media; picture-in-picture';
            iframe.style.cssText='width:1280px;border:0;background:#fff;pointer-events:none;';
            const size=monitor.mesh.geometry.parameters;
            iframe.style.height=(1280*size.height/size.width)+'px';
            iframe.addEventListener('load',()=>{
              if(!/youtube(?:-nocookie)?\.com\/embed\//.test(iframe.src))return;
              const origin=new URL(iframe.src).origin;iframe.contentWindow.postMessage(JSON.stringify({event:'listening',id:'monitor-player'}),origin);monitor.youtubeMode=null;
              for(const delay of [300,900,1800])setTimeout(()=>resumeMonitorYoutube(monitor),delay);
            });
            monitor.websiteScreen=new CSS3DObject(iframe);monitor.websiteScreen.scale.setScalar(size.width/1280);videoScene.add(monitor.websiteScreen);
          }
          if(monitor.websiteScreen) {
            const url=monitor.contentKind==='website'?monitor.websiteUrl:'about:blank';
            if(monitor.displayedWebsiteUrl!==url){
              try {monitor.websiteScreen.element.src=url==='about:blank'?url:embeddedMonitorUrl(url,{autoplay:true,muted:true});}
              catch(error){monitor.websiteScreen.element.src='about:blank';console.warn('Link nao carregado:',error.message);}
              monitor.displayedWebsiteUrl=url;
            }
          }
          if(monitor.websiteScreen && /youtube(?:-nocookie)?\.com\/embed\//.test(monitor.websiteScreen.element.src)) {
            const expanded=activeScreen===monitor && document.getElementById('screenView').style.display==='flex';
            const mode=expanded?'preview':'room';
            if(monitor.youtubeMode!==mode) {
              monitor.youtubeMode=mode;
              const iframe=monitor.websiteScreen.element,origin=new URL(iframe.src).origin;
              for(const func of expanded?['mute','pauseVideo']:(monitor.audioEnabled?['unMute','playVideo']:['mute','playVideo']))iframe.contentWindow.postMessage(JSON.stringify({event:'command',func,args:[]}),origin);
            }
          }
          for(const [screen,active] of [[monitor.htmlScreen,monitor.contentKind==='video' && !!monitor.url],[monitor.websiteScreen,monitor.contentKind==='website' && !!monitor.websiteUrl]]) {
            if(!screen)continue;
            monitor.mesh.getWorldPosition(screenPosition);monitor.mesh.getWorldQuaternion(screen.quaternion);
            screenNormal.set(0,0,1).applyQuaternion(screen.quaternion);
            screen.position.copy(screenPosition).addScaledVector(screenNormal,.006);
            const towardCamera=camera.position.clone().sub(screen.position);
            let visible=active && isSceneVisible(monitor.mesh) && screenNormal.dot(towardCamera)>0;
            if (visible && (checkOcclusion || screen.userData.occlusionVisible === undefined)) {
              screenRay.set(screen.position.clone().addScaledVector(screenNormal,.02),towardCamera.normalize());
              let owner=monitor.mesh;while(owner.parent && !owner.userData.id && !owner.userData.screenOwner)owner=owner.parent;
              const belongsToMonitor=object=>{for(let node=object;node;node=node.parent)if(node===owner)return true;return false;};
              // O HTML da tela nao tem profundidade WebGL: esconde-o se uma parede estiver na frente.
              const toCamera=camera.getWorldDirection(new THREE.Vector3()).negate();
              const samples=[screen.position.clone()];
              if(monitor.mesh===guedesTvScreen) {
                const size=monitor.mesh.geometry.parameters;
                for(const x of [-.48,.48])for(const y of [-.48,.48])samples.push(new THREE.Vector3(x*size.width,y*size.height,0).applyQuaternion(screen.quaternion).add(screen.position));
              }
              visible=samples.every(point=>{
                const origin=point.clone().addScaledVector(screenNormal,.02);
                screenRay.set(origin,toCamera);
                const depth=camera.position.clone().sub(origin).dot(toCamera);
                const obstruction=screenRay.intersectObjects(scene.children,true).find(h=>!belongsToMonitor(h.object) && isSceneVisible(h.object));
                return !obstruction || obstruction.distance>=depth;
              });
              screen.userData.occlusionVisible=visible;
            } else if (visible) {
              visible=screen.userData.occlusionVisible;
            } else {
              screen.userData.occlusionVisible=false;
            }
            screen.visible=visible;
          }
        }
        videoRenderer.render(videoScene,camera);
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
        monitor.contentKind = 'default';
        monitor.status.textContent = 'Codigo do laboratorio';
        monitor.websiteStatus.textContent = 'GuedesSEC configurado • clique no monitor para abrir.';
        paintWebsitePreview(monitor);
      }
      guedesLogo.onload = () => {
        paintPoster();
        for (const monitor of Object.values(monitorVideos)) if(monitor.contentKind === 'website') paintWebsitePreview(monitor);
      };
      guedesLogo.onerror = error => console.warn('Não foi possível carregar a logo GuedesSEC para os monitores e o quadro.', error);
      guedesLogo.src = guedesLogoUrl;
      for (const monitor of Object.values(monitorVideos)) {
        monitor.video.muted = false;
        monitor.video.volume = 1;
        monitor.video.loop = true;
        monitor.video.playsInline = true;
        monitor.video.preload = 'auto';
        monitor.video.addEventListener('play', () => { monitor.playButton.textContent = '⏸ Pausar' });
        monitor.video.addEventListener('pause', () => { monitor.playButton.textContent = '▶ Reproduzir' });
      }
      const previewVideoHome = document.getElementById('bigVideo');
      let previewVideo = previewVideoHome;
      // O som vem do monitor 3D; a prévia não deve reproduzir outra faixa por cima.
      previewVideo.muted = true;
      const websiteFrame = document.getElementById('websiteFrame');
      const openWebsiteTab = document.getElementById('openWebsiteTab');
      function youtubeCommand(frame,func,args=[]) {
        if(!frame?.contentWindow || !/youtube(?:-nocookie)?\.com\/embed\//.test(frame.src))return;
        frame.contentWindow.postMessage(JSON.stringify({event:'command',func,args}),new URL(frame.src).origin);
      }
      function resumeMonitorYoutube(monitor) {
        if(!monitor?.websiteScreen)return;
        const frame=monitor.websiteScreen.element;
        const expanded=activeScreen===monitor && document.getElementById('screenView').style.display==='flex';
        if(expanded){youtubeCommand(frame,'mute');youtubeCommand(frame,'pauseVideo');}
        else {if(monitor.audioEnabled){youtubeCommand(frame,'setVolume',[100]);youtubeCommand(frame,'unMute');}else youtubeCommand(frame,'mute');youtubeCommand(frame,'playVideo');}
      }

      websiteFrame.addEventListener('load',()=>{
        if(!/youtube(?:-nocookie)?\.com\/embed\//.test(websiteFrame.src))return;
        const origin=new URL(websiteFrame.src).origin;
        websiteFrame.contentWindow.postMessage(JSON.stringify({event:'listening',id:'homelab-player'}),origin);
        websiteFrame.contentWindow.postMessage(JSON.stringify({event:'command',func:'addEventListener',args:['onError']}),origin);
      });
      window.addEventListener('message',event=>{
        if(!['https://www.youtube.com','https://www.youtube-nocookie.com'].includes(event.origin)||event.source!==websiteFrame.contentWindow)return;
        let data;try{data=typeof event.data==='string'?JSON.parse(event.data):event.data;}catch{return;}
        if(data?.event!=='onError')return;
        const explanations={2:'O link ou identificador do video e invalido.',5:'O navegador nao conseguiu reproduzir este video.',100:'Video removido, privado ou inexistente.',101:'O autor nao permite exibir este video fora do YouTube.',150:'O autor nao permite exibir este video fora do YouTube.',153:'O YouTube nao identificou a origem. Abra o laboratorio pelo Live Server, e confira bloqueadores do navegador.'};
        document.getElementById('screenViewMessage').textContent='YouTube ('+data.info+'): '+(explanations[data.info]||'Nao foi possivel reproduzir. Tente abrir em nova aba.');
      });

      const screenViewMessage = document.getElementById('screenViewMessage');
      let previewMonitorId = null;
      function showMonitorPreview(id) {
        const monitor=monitorVideos[id];if(monitor)openAnyScreen(monitor);
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
          url = normalizeMonitorUrl(enteredUrl);
          embeddedMonitorUrl(url.href);
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
      document.getElementById('matrixMode').onclick = () => { for(const monitor of playableScreens.values()) { monitor.video.pause();monitor.contentKind='default';monitor.mesh.material=monitor.defaultMaterial; } };
      document.getElementById('playBothMonitors').onclick = () => {
        // Inicia ambos diretamente no clique para liberar ?udio nos dois vídeos.
        for (const monitor of Object.values(monitorVideos)) {
          if (!monitor.url) {
            monitor.status.textContent = 'Escolha um vídeo para este monitor.';
            continue;
          }
          monitor.contentKind = 'video';
          monitor.mesh.material = monitor.videoMaterial;
          monitor.video.muted = false;
          monitor.video.volume = 1;
          monitor.video.play().catch(error => {
            console.warn('Não foi possível iniciar ' + monitor.label, error);
            monitor.status.textContent = 'Clique em Reproduzir neste monitor para liberar o som.';
          });
        }
      };

      function localVideoError(video) {
        return video.error?.code===4 ? 'Este navegador nao conseguiu abrir o formato/codec do arquivo. Se estiver no navegador integrado do VS Code, abra este mesmo endereco no Edge externo. Teste WebM ou MP4 H.264/AAC.' : video.error?.code===3 ? 'O navegador nao conseguiu decodificar este filme. Teste outro arquivo MP4 H.264/AAC.' : 'Nao foi possivel carregar o video. Selecione o arquivo novamente.';
      }
      function reportLocalVideoError(monitor,message) {
        if(monitor.status)monitor.status.textContent=message;
        if(activeScreen===monitor)screenViewMessage.textContent=message;
      }
      function loadLocalFilm(monitor,file,expand) {
        monitor.fileName=file.name;monitor.fileSize=file.size;
        const previous=monitor.url;
        previewVideo.pause();monitor.video.pause();
        monitor.video.removeAttribute('src');monitor.video.load();
        monitor.url=URL.createObjectURL(file);monitor.contentKind='video';
        monitor.video.playsInline=true;monitor.video.preload='auto';monitor.video.loop=true;monitor.video.muted=expand;monitor.video.volume=1;
        monitor.video.src=monitor.url;
        monitor.video.onerror=()=>reportLocalVideoError(monitor,localVideoError(monitor.video));
        if(previous)setTimeout(()=>URL.revokeObjectURL(previous),1000);
        if(monitor.texture)monitor.texture.dispose();
        monitor.texture=new THREE.VideoTexture(monitor.video);monitor.texture.colorSpace=THREE.SRGBColorSpace;monitor.texture.minFilter=THREE.LinearFilter;monitor.texture.magFilter=THREE.LinearFilter;monitor.texture.generateMipmaps=false;
        if(monitor.videoMaterial)monitor.videoMaterial.dispose();
        monitor.videoMaterial=textureMat(monitor.texture);monitor.mesh.material=monitor.videoMaterial;
        if(monitor.status)monitor.status.textContent=file.name;
        monitor.video.load();
        if(expand)openAnyScreen(monitor);
        else monitor.video.play().catch(error=>reportLocalVideoError(monitor,error.name==='NotAllowedError'?'Clique em Reproduzir para iniciar com som.':localVideoError(monitor.video)));
      }
      for (const [id, monitor] of Object.entries(monitorVideos)) {
        monitor.fileInput.addEventListener('change',e=>{
          const file=e.target.files?.[0];e.target.value='';if(!file)return;
          loadLocalFilm(monitor,file,activeScreen===monitor && document.getElementById('screenView').style.display==='flex');
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
      // Ampliacao do laboratorio para as tres estacoes pessoais.
      box(scene,14,.24,5,tile,2.5,-.13,6);
      box(buildingBase,14.2,.2,5.15,buildingEdge,2.5,-.32,6);
      const officeTower = new THREE.Mesh(new THREE.BoxGeometry(14,18,5),[buildingFacade,buildingFacade,buildingConcrete,buildingConcrete,buildingFacade,buildingFacade]);
      officeTower.position.set(2.5,-9.43,6); buildingBase.add(officeTower);
      // Abertura entre o laboratorio original e a nova area.
      roomWalls.front.group.remove(frontWall);
      const oldFrontTrim = roomWalls.front.group.children.find(mesh => Math.abs(mesh.position.z - 3.5) < .01 && mesh.position.y > 3);
      if(oldFrontTrim) roomWalls.front.group.remove(oldFrontTrim);
      partition(roomWalls.front.group,3.8,3.3,.14,-2.6,1.65,3.5,frontWall.material);
      partition(roomWalls.front.group,3.8,3.3,.14,2.6,1.65,3.5,frontWall.material);
      partition(roomWalls.front.group,1.4,.85,.14,0,2.875,3.5,frontWall.material);
      partition(roomWalls.front.group,14,3.3,.14,2.5,1.65,8.5,frontWall.material);
      partition(roomWalls.left.group,.14,3.3,5,-4.5,1.65,6,leftWall.material);
      partition(roomWalls.right.group,.14,3.3,5,9.5,1.65,6,rightWall.material);
      const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=256;
      const floorCtx=floorCanvas.getContext('2d');floorCtx.fillStyle='#ad9b85';floorCtx.fillRect(0,0,256,256);
      floorCtx.fillStyle='#897c6c';floorCtx.fillRect(0,0,256,3);floorCtx.fillRect(0,0,3,256);
      floorCtx.fillStyle='#c5b6a222';floorCtx.fillRect(3,3,250,2);
      const uniformFloor=new THREE.CanvasTexture(floorCanvas);uniformFloor.colorSpace=THREE.SRGBColorSpace;
      uniformFloor.wrapS=uniformFloor.wrapT=THREE.RepeatWrapping;uniformFloor.repeat.set(14/.75,12/.75);
      uniformFloor.anisotropy=renderer.capabilities.getMaxAnisotropy();
      const floorSurface=new THREE.Mesh(new THREE.PlaneGeometry(14,12),new THREE.MeshStandardMaterial({map:uniformFloor,roughness:.85}));
      floorSurface.rotation.x=-Math.PI/2;floorSurface.position.set(2.5,.03,2.5);floorSurface.receiveShadow=true;scene.add(floorSurface);
      const defaultFloorStyle={pattern:'square',tint:'#565c63',grout:'#3e444a',scale:.75,joint:3,direction:0,finish:'matte'};
      const environmentStyle={floors:{},wallFinish:'matte',exposure:1.4,daylight:true};
      const floorZones={lab:{w:9,d:7,x:0,z:0},servers:{w:5,d:3.5,x:7,z:-1.75},bath:{w:5,d:3.5,x:7,z:1.75},office:{w:14,d:5,x:2.5,z:6}};
      floorSurface.visible=false;
      for(const [id,zone] of Object.entries(floorZones)) {
        environmentStyle.floors[id]={...defaultFloorStyle};
        const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
        const material=new THREE.MeshStandardMaterial({map:texture,roughness:.85});
        const mesh=new THREE.Mesh(new THREE.PlaneGeometry(zone.w,zone.d),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(zone.x,.034,zone.z);mesh.receiveShadow=true;scene.add(mesh);
        Object.assign(zone,{canvas,texture,material});
      }
      function drawEnvironmentFloor(id) {
        const zone=floorZones[id],style=environmentStyle.floors[id],ctx=zone.canvas.getContext('2d');
        ctx.fillStyle=style.tint;ctx.fillRect(0,0,256,256);ctx.strokeStyle=style.grout;ctx.lineWidth=style.joint;
        if(style.pattern==='hex') {
          ctx.fillStyle=style.grout;ctx.fillRect(0,0,256,256);ctx.fillStyle=style.tint;
          const radius=42.6667;
          for(let col=-1;col<6;col++)for(let row=-1;row<5;row++) {
            const x=col*64,y=row*73.9008+(col%2)*36.9504;ctx.beginPath();
            for(let k=0;k<6;k++){const angle=k*Math.PI/3;const px=x+Math.cos(angle)*(radius-style.joint/2),py=y+Math.sin(angle)*(radius-style.joint/2);if(k===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();
          }
        } else if(style.pattern!=='plain') {
          const rows=style.pattern==='wood'?4:style.pattern==='rectangle'?2:1;
          for(let row=0;row<rows;row++) {
            ctx.strokeRect(0,row*256/rows,256,256/rows);
            if(style.pattern==='wood') {
              ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle='#3e291c';ctx.lineWidth=1;
              for(let grain=0;grain<5;grain++){ctx.beginPath();ctx.moveTo(0,row*64+12+grain*9);ctx.bezierCurveTo(80,row*64+grain*9+5,180,row*64+grain*9+20,256,row*64+grain*9+12);ctx.stroke();}ctx.restore();
              ctx.beginPath();ctx.moveTo(row%2?128:0,row*64);ctx.lineTo(row%2?128:0,(row+1)*64);ctx.stroke();
            }
          }
        }
        zone.texture.repeat.set(zone.w/style.scale,zone.d/style.scale);zone.texture.center.set(.5,.5);zone.texture.rotation=style.direction*Math.PI/180;zone.texture.needsUpdate=true;
        zone.material.roughness={matte:.9,satin:.55,polished:.2}[style.finish];
      }
      Object.keys(floorZones).forEach(drawEnvironmentFloor);
      function npcWorkstation(id, name, x, whitePc) {
        const station = item(id,'Estacao de '+name,'floor',x,0,7.7,'Setup pessoal de '+name+': mesa, dois monitores, computador e perifericos iguais aos do jogador.');
        station.rotation.y = Math.PI;
        const pieces = [
          ['mesa',[0,0,0],0], ['monitor1',[-.58,1.11,-.14],0], ['monitor2',[1.02,1.11,-.14],0],
          ['pc',[-1.89,1.0975,0],-Math.PI/2], ['mousepad',[.3,1.115,.22],0],
          ['teclado',[-.15,1.11715,.22],0], ['mouse',[.85,1.121,.22],0], ['cadeira',[-.15,0,.65],0]
        ];
        for(const [source,position,rotation] of pieces) {
          const copy=byId[source].g.clone(true); copy.position.set(...position); copy.rotation.y=rotation;
          const lights=[];
          copy.traverse(node=>{
            const isScreen = node.userData.isScreen;
            const isPcFan = node.userData.isPcFan;
            if(isPcFan) animatedPcFans.push(node);
            node.userData = { ...(isScreen ? { isScreen: true } : {}), ...(isPcFan ? { isPcFan: true } : {}) };
            if(isScreen) node.material = terminalMat;
            if(node.isLight) lights.push(node);
            if(node.isMesh) {
              node.castShadow=false;
              if(!whitePc && !isScreen && ['pc','monitor1','monitor2','teclado','mouse','mousepad'].includes(source)) {
                const customize=material=>{
                  if(!material.color||material.map||material.transparent)return material;
                  const changed=material.clone();
                  if(material.isMeshBasicMaterial)changed.color.set(id==='setupXandy'?'#36bfff':'#ffb94d');
                  else if(source==='mousepad')changed.color.set(id==='setupXandy'?'#112b42':'#302a22');
                  else if((material.color.r+material.color.g+material.color.b)/3<.12)changed.color.set(id==='setupXandy'?'#102b40':'#252a2e');
                  return changed;
                };
                node.material=Array.isArray(node.material)?node.material.map(customize):customize(node.material);
              }
              if(whitePc && ['pc','monitor1','monitor2','teclado','mouse'].includes(source) && !isScreen) {
                const convert=material=>{
                  if(source==='teclado' && material.map===keyboardLegendTexture) {
                    const legend=material.clone();legend.color.set('#25313a');return legend;
                  }
                  if(!material.color || material.transparent || material.isMeshBasicMaterial) return material;
                  const lightness=(material.color.r+material.color.g+material.color.b)/3;
                  if(lightness>.16) return material;
                  const updated=material.clone();updated.color.set('#eef1f4');return updated;
                };
                node.material=Array.isArray(node.material)?node.material.map(convert):convert(node.material);
              }
            }
          });
          if(source==='pc' && !whitePc) {
            const accent=glow(id==='setupXandy'?'#36bfff':'#ffb94d');
            if(id==='setupXandy') {
              for(const x of [-.35,.35])box(copy,.018,.96,.018,accent,x,.63,.492,.003);
              for(let i=0;i<3;i++){const rail=box(copy,.13,.012,.018,accent,-.25+i*.22,.135,.49,.002);rail.rotation.z=.4;}
            } else {
              for(let row=0;row<13;row++)box(copy,.66,.013,.02,M('#333c42',.6,.55),0,.19+row*.065,.495,.002);
              box(copy,.38,.025,.018,accent,0,1.13,.5,.003);
            }
            const badgeCanvas=document.createElement('canvas');badgeCanvas.width=512;badgeCanvas.height=128;
            const ctx=badgeCanvas.getContext('2d');ctx.fillStyle=id==='setupXandy'?'#102b40':'#252a2e';ctx.fillRect(0,0,512,128);ctx.fillStyle=id==='setupXandy'?'#77d6ff':'#ffd38a';ctx.textAlign='center';ctx.font='bold 30px monospace';ctx.fillText(id==='setupXandy'?'XANDY / DEV NODE':'ALEX / SECURE NODE',256,60);ctx.font='16px monospace';ctx.fillText('GUEDESSEC',256,98);
            const texture=new THREE.CanvasTexture(badgeCanvas);texture.colorSpace=THREE.SRGBColorSpace;
            const badge=new THREE.Mesh(new THREE.PlaneGeometry(.52,.13),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));badge.position.set(0,.09,.51);copy.add(badge);
          }
          lights.forEach(light=>light.removeFromParent());copy.userData.stationPiece=source; station.add(copy);
          if(source === 'cadeira') station.userData.chair = copy;
          if(source === 'teclado') station.userData.keyboard = copy;
          if(source === 'pc') station.userData.networkPc = copy;
        }
      }
      npcWorkstation('setupVitoria','Vitoria',-2.05,true);
      npcWorkstation('setupXandy','Xandy',2.5,false);
      npcWorkstation('setupAlex','Alex',7.05,false);
      const playableScreens = new Map(Object.values(monitorVideos).map(m => [m.mesh, m]));
      playableScreens.set(guedesTvScreen, {
        mesh: guedesTvScreen,
        video: document.createElement('video'),
        url: null,
        websiteUrl: 'https://guedessec.online/',
        contentKind: 'website',
        label: 'TV GuedesSEC',
        fixedSite: true
      });
      for(const id of ['setupVitoria','setupXandy','setupAlex']) {
        let index=0;
        byId[id].g.traverse(mesh=>{ if(mesh.userData.isScreen) {
          mesh.material=terminalMat;
          const video=document.createElement('video');video.playsInline=true;video.loop=true;
          playableScreens.set(mesh,{mesh,video,url:null,contentKind:'default',label:byId[id].label+' / Tela '+(++index)});
        }});
      }
      const screenThemes = [
        { title:'JOHN / app.js', color:'#70d7ff', type:'code', lines:['import { createLab } from "./core";', '', 'const lab = createLab({ secure: true });', 'async function start() {', '  await lab.connect();', '  const nodes = await lab.discover();', '  return nodes.map(node => node.status);', '}', '', 'start().then(console.log);'] },
        { title:'JOHN / INFRASTRUCTURE',color:'#62eea0',type:'terminal',lines:['john@homelab:~$ docker compose ps','api        running   :3000','database   healthy   :5432','proxy      running   :443','','$ systemctl status lab-agent','Active: active (running)','$ tail -f /var/log/lab.log'] },
        { title:'VITORIA / interface.tsx',color:'#edb4ec',type:'code',lines:['import { useState } from "react";','','export function Dashboard() {','  const [online, setOnline] = useState(true);','  return (','    <Panel title="Home Lab">','      <Status online={online} />','      <DeviceList />','    </Panel>','  );','}'] },
        { title:'VITORIA / TEST RUNNER',color:'#8fe0ce',type:'tests',lines:['PASS  interface.test.tsx','  [ok] renders device list','  [ok] switches theme','  [ok] handles offline state','','PASS  accessibility.test.ts','  [ok] keyboard navigation','  [ok] labels and contrast','','Test suites: 2 passed','Tests:       5 passed'] },
        { title:'XANDY / NETWORK LAB',color:'#58cafb',type:'network',lines:['GATEWAY       192.168.1.1','LAB SERVER    192.168.1.10','WORKSTATIONS  4 connected','','VLAN 10 / DEVELOPMENT','VLAN 20 / SERVICES','DNS           local resolver'] },
        { title:'XANDY / deploy.py',color:'#f4d276',type:'code',lines:['from lab import Server, deploy','','servers = Server.discover()','for server in servers:','    if server.healthcheck():','        deploy(server, branch="main")','        print(f"Ready: {server.name}")','','# build -> test -> deploy','# waiting for next commit...'] },
        { title:'ALEX / SECURITY MONITOR',color:'#d3e396',type:'graph',lines:['LOCAL LAB / DEMONSTRATION','Firewall rules    active','Backup policy     enabled','SSH access        key-based','','SERVICE HEALTH','API      OK','DNS      OK','STORAGE  OK'] },
        { title:'ALEX / backup.sh',color:'#efad83',type:'terminal',lines:['alex@lab:~$ ./backup.sh','[1/4] Checking available space','[2/4] Creating archive','[3/4] Verifying checksum','[4/4] Testing restore','','Backup complete.','$ git log --oneline','a7c21d4 add restore verification','e12ab09 update backup schedule'] }
      ];
      let themeIndex=0;
      for(const monitor of playableScreens.values()) {
        if (monitor.fixedSite) continue;
        const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
        texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
        monitor.nativeDisplay={canvas,texture,owner:['player','setupVitoria','setupXandy','setupAlex'][Math.floor(themeIndex/2)],theme:screenThemes[themeIndex++],typed:0,clock:0,lastTime:null,painted:false,lastActive:false};
        monitor.defaultMaterial=textureMat(texture);
        if(monitor.contentKind==='default')monitor.mesh.material=monitor.defaultMaterial;
      }
      let lastNativeFrame=-1;
      function paintNativeScreens(time) {
        const tick=Math.floor(time/250);if(tick===lastNativeFrame)return;lastNativeFrame=tick;
        for(const monitor of playableScreens.values()) {
          if(monitor.contentKind!=='default')continue;
          if(!monitor.nativeDisplay)continue;
          const display=monitor.nativeDisplay;
          const {canvas,texture,theme}=display,ctx=canvas.getContext('2d');
          const worker=npcs.find(npc=>npc.task?.id===display.owner);
          const active=!edit&&(display.owner==='player'?interactionPose==='typing':!!worker?.seated&&!worker.callRemaining&&worker!==talkingNpc);
          const elapsed=display.lastTime===null?0:Math.min(.3,(time-display.lastTime)/1000);display.lastTime=time;
          const total=theme.lines.reduce((sum,line)=>sum+line.length+1,0);
          if(active){display.clock+=elapsed;display.typed+=elapsed*(theme.type==='code'?25:35);if(display.typed>total+65)display.typed=0;}
          if(!active&&display.painted&&display.lastActive===active)continue;
          display.painted=true;display.lastActive=active;
          let remaining=Math.floor(display.typed),cursorX=72,cursorY=91;
          const animationTick=Math.floor(display.clock*4);
          ctx.fillStyle='#0c121e';ctx.fillRect(0,0,960,540);
          ctx.fillStyle=theme.color;ctx.fillRect(0,0,5,540);
          ctx.fillStyle='#1b2535';ctx.fillRect(5,0,955,52);
          ctx.fillStyle=theme.color;ctx.font='bold 21px monospace';ctx.fillText(theme.title,28,34);
          ctx.font='20px monospace';
          theme.lines.forEach((line,i)=>{
            const y=91+i*32;
            ctx.fillStyle='#46566e';ctx.fillText(String(i+1).padStart(2,'0'),22,y);
            ctx.fillStyle=line.startsWith('#')||line.startsWith('//')?'#748399':i%3===0?theme.color:'#ccd4e3';
            const shown=line.slice(0,Math.max(0,remaining));
            if(remaining>=0){ctx.fillText(shown,72,y);cursorX=72+ctx.measureText(shown).width;cursorY=y;}
            remaining-=line.length+1;
          });
          if(theme.type==='graph'||theme.type==='network') {
            ctx.fillStyle='#101f2c';ctx.fillRect(535,80,395,355);
            ctx.strokeStyle=theme.color;ctx.lineWidth=3;ctx.beginPath();
            for(let i=0;i<39;i++) {const x=545+i*10,y=310-Math.sin(i*.65+animationTick*.17)*35-Math.sin(i*.21)*65;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
            ctx.stroke();ctx.fillStyle=theme.color;ctx.fillText(theme.type==='network'?'NETWORK TRAFFIC':'SERVICE ACTIVITY',555,120);
            ctx.font='14px monospace';ctx.fillStyle='#8393a9';ctx.fillText('Simulacao visual / dados locais',555,410);
          }
          ctx.fillStyle='#172436';ctx.fillRect(5,507,955,33);
          ctx.fillStyle=theme.color;ctx.font='16px monospace';ctx.fillText('GuedesSEC   |   '+(active?'DIGITANDO...':display.typed>0?'PAUSADO':'AGUARDANDO DIGITACAO'),25,529);
          if(active&&animationTick%2===0){ctx.fillStyle=theme.color;ctx.fillRect(cursorX,Math.min(485,cursorY+5),11,3);}
          texture.needsUpdate=true;
        }
      }
      const screenActions=document.createElement('div'); screenActions.className='screenActions';
      screenActions.innerHTML='<h3>Conteudo</h3><div class="monitorUploadCard"><div class="monitorUploadTop"><span class="monitorUploadIcon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4z" stroke-linejoin="round"/></svg></span><div class="monitorUploadText"><strong id="monitorFileName">Seu filme no monitor</strong><small id="monitorFileDetail">Selecione um arquivo de video</small></div></div><button type="button" id="screenFileChoose"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5" stroke-linecap="round" stroke-linejoin="round"/></svg><span id="screenFileChooseText">Escolher arquivo</span></button><input id="screenMediaFile" type="file" accept="video/*" hidden><p class="monitorUploadHint">Arquivo local &middot; sem envio para servidores</p></div><div class="monitorDivider"><span>ou abra um link</span></div><label class="monitorFieldLabel" for="screenMediaUrl">Site ou YouTube</label><div class="monitorUrlRow"><input id="screenMediaUrl" type="text" inputmode="url" placeholder="Cole o endereco aqui" autocomplete="off" spellcheck="false"><button id="screenMediaOpen">Abrir</button></div><button id="screenMediaCode" class="monitorSecondary">Restaurar tela de codigo</button>';
      document.getElementById('monitorOptions').append(screenActions);
      const soundActions=document.createElement('div');soundActions.className='screenActions';
      const soundButton=document.createElement('button');soundButton.textContent='Reproduzir com som';
      const roomSoundButton=document.createElement('button');roomSoundButton.textContent='Continuar no cenario';
      const playbackHeading=document.createElement('h3');playbackHeading.textContent='Reproducao';soundActions.append(playbackHeading,soundButton,roomSoundButton);screenActions.after(soundActions);
      soundButton.onclick=()=>{
        if(!activeScreen)return;
        activeScreen.audioEnabled=true;
        if(activeScreen.contentKind==='video'){previewVideo.muted=false;previewVideo.volume=1;previewVideo.play().catch(()=>{screenViewMessage.textContent='Clique no botao de reproducao do video.';});}
        else {youtubeCommand(websiteFrame,'setVolume',[100]);youtubeCommand(websiteFrame,'unMute');youtubeCommand(websiteFrame,'playVideo');websiteFrame.focus();}
      };
      roomSoundButton.onclick=()=>{
        const monitor=activeScreen;if(!monitor)return;monitor.audioEnabled=true;
        if(monitor.contentKind==='video'){monitor.video.muted=false;monitor.video.volume=1;monitor.video.play().catch(()=>{});}
        document.getElementById('closeScreen').click();resumeMonitorYoutube(monitor);
      };

      const interactOnScreen=document.createElement('button');interactOnScreen.textContent='Interagir na tela 3D';soundActions.append(interactOnScreen);
      let interactiveMonitor=null;
      const exitScreenInteraction=document.createElement('button');exitScreenInteraction.id='exitScreenInteraction';exitScreenInteraction.textContent='Sair da tela do monitor';exitScreenInteraction.hidden=true;document.body.append(exitScreenInteraction);
      function stopScreenInteraction(){
        if(interactiveMonitor?.websiteScreen)interactiveMonitor.websiteScreen.element.classList.remove('interactiveMonitorFrame');
        interactiveMonitor=null;exitScreenInteraction.hidden=true;
      }
      exitScreenInteraction.onclick=stopScreenInteraction;
      window.addEventListener('keydown',e=>{if(e.key==='Escape')stopScreenInteraction();});
      interactOnScreen.onclick=()=>{
        if(!activeScreen || activeScreen.contentKind!=='website'){screenViewMessage.textContent='Abra um site ou link do YouTube primeiro.';return;}
        const monitor=activeScreen;stopScreenInteraction();monitor.audioEnabled=true;
        document.getElementById('closeScreen').click();
        if(monitor.websiteScreen){interactiveMonitor=monitor;monitor.websiteScreen.element.classList.add('interactiveMonitorFrame');exitScreenInteraction.hidden=false;resumeMonitorYoutube(monitor);}
      };
      let activeScreen=null;
      function releaseLocalPlayer(monitor) {
        if(!monitor?.localExpanded)return;
        const video=monitor.video,wasPlaying=!video.paused;
        monitor.localExpanded=false;video.controls=false;video.hidden=false;video.remove();
        video.style.cssText='width:1280px;object-fit:contain;background:#000;pointer-events:none;';
        monitor.htmlScreen=null;previewVideo=previewVideoHome;previewVideoHome.hidden=true;
        if(wasPlaying&&monitor.contentKind==='video')video.play().catch(()=>{});
      }

      function openAnyScreen(monitor) {
        if(!monitor)return;
        stopScreenInteraction();
        releaseLocalPlayer(activeScreen);
        activeScreen=monitor;previewMonitorId=monitor.id||null;keys.clear();
        previewVideo.pause(); websiteFrame.src='about:blank';
        document.getElementById('screenViewTitle').textContent=monitor.label;
        document.getElementById('screenMediaUrl').value=monitor.websiteUrl||'';
        screenActions.hidden = !!monitor.fixedSite;
        document.getElementById('monitorFileName').textContent=monitor.fileName||'Seu filme no monitor';
        document.getElementById('monitorFileName').title=monitor.fileName||'';
        document.getElementById('monitorFileDetail').textContent=monitor.fileName?(monitor.fileSize/1048576).toFixed(1)+' MB / arquivo local':'Selecione um arquivo de video';
        document.getElementById('screenFileChooseText').textContent=monitor.fileName?'Trocar arquivo':'Escolher arquivo';
        document.querySelector('#screenView article').dataset.content=monitor.contentKind;
        document.getElementById('monitorEmpty').hidden=monitor.contentKind!=='default';
        const isYoutube=monitor.contentKind==='website' && /youtube(?:-nocookie)?\.com|youtu\.be/.test(monitor.websiteUrl||'');
        soundButton.hidden=!(monitor.contentKind==='video'||isYoutube);
        roomSoundButton.hidden=monitor.contentKind==='default';
        interactOnScreen.hidden=monitor.contentKind!=='website';
        soundActions.hidden=monitor.contentKind==='default';
        previewVideo.hidden=true;websiteFrame.hidden=true;openWebsiteTab.hidden=true;
        screenViewMessage.textContent='Cole um link e clique em Abrir site. Se o site bloquear a exibicao, use Abrir site em nova aba.';
        document.getElementById('screenView').style.display='flex';
        if(monitor.contentKind==='video' && monitor.url) {
          monitor.localExpanded=true;
          if(monitor.htmlScreen)monitor.htmlScreen.removeFromParent();
          monitor.htmlScreen=null;previewVideo=monitor.video;
          previewVideo.style.cssText='display:block;position:static;transform:none;width:100%;max-height:65vh;background:#000;pointer-events:auto;';
          previewVideo.controls=true;previewVideo.hidden=false;previewVideo.muted=false;previewVideo.volume=1;
          websiteFrame.before(previewVideo);
          screenViewMessage.textContent='Video local: o mesmo player continua na tela do monitor ao fechar.';
          previewVideo.play().catch(error=>{if(error.name!=='AbortError')reportLocalVideoError(monitor,error.name==='NotAllowedError'?'Clique no Play do video.':localVideoError(previewVideo));});
        } else if(monitor.contentKind==='website' && monitor.websiteUrl) {
          websiteFrame.src=embeddedMonitorUrl(monitor.websiteUrl,{autoplay:true});websiteFrame.hidden=false;openWebsiteTab.href=monitor.websiteUrl;openWebsiteTab.hidden=false;
          if (monitor.fixedSite) screenViewMessage.textContent='Transmitindo GuedesSEC. A TV permanece ligada enquanto o laboratorio estiver aberto.';
        }
      }
      document.getElementById('screenFileChoose').onclick=()=>document.getElementById('screenMediaFile').click();
      document.getElementById('screenMediaFile').onchange=e=>{
        const file=e.target.files?.[0];e.target.value='';if(file&&activeScreen)loadLocalFilm(activeScreen,file,true);
      };
      document.getElementById('screenMediaUrl').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('screenMediaOpen').click();}});
      document.getElementById('screenMediaOpen').onclick=()=>{
        if(!activeScreen)return;
        try {
          const url=normalizeMonitorUrl(document.getElementById('screenMediaUrl').value);
          embeddedMonitorUrl(url.href);
          if(!['http:','https:'].includes(url.protocol))throw Error();
          activeScreen.video.pause();activeScreen.websiteUrl=url.href;activeScreen.contentKind='website';openAnyScreen(activeScreen);
        }catch(error){screenViewMessage.textContent=error.message;}
      };
      document.getElementById('screenMediaCode').onclick=()=>{
        if(!activeScreen)return;
        activeScreen.video.pause();activeScreen.contentKind='default';activeScreen.mesh.material=activeScreen.defaultMaterial;openAnyScreen(activeScreen);
      };
      document.getElementById('closeScreen').onclick=()=>{
        const monitor=activeScreen;
        releaseLocalPlayer(monitor);activeScreen=null;previewMonitorId=null;
        previewVideoHome.pause();previewVideoHome.hidden=true;
        websiteFrame.src='about:blank';document.getElementById('screenView').style.display='none';
        if(monitor)setTimeout(()=>resumeMonitorYoutube(monitor),100);
      };
      // Canaletas continuas: os quatro cabos ficam agrupados junto ao teto.
      // Cabos permanecem junto ao teto, sem faixas salientes sobre as paredes.
      const stationCables=new THREE.Group();scene.add(stationCables);
      const blueCableMaterial=new THREE.MeshStandardMaterial({color:'#187ef5',roughness:.55});
      const cableConnections=[];
      for(const [i,id] of ['pc','setupVitoria','setupXandy','setupAlex'].entries()) {
        const geometry=new THREE.BufferGeometry();const mesh=new THREE.Mesh(geometry,blueCableMaterial);stationCables.add(mesh);
        cableConnections.push({id,index:i,mesh,signature:'',wallMeshes:[]});
      }
      const extraRackWiring={signature:'',meshes:[]};
      const modemUplink={signature:'',meshes:[]};
      let cableUpdateTime=-1000;
      function updateStationCables(time) {
        if(time-cableUpdateTime<400)return;cableUpdateTime=time;
        const extraPorts=[0,1,2,3,4,5].map(i=>byId[i<4?'rackExtraTI':i===4?'bancadaTI':'instrumentosTI'].g.localToWorld(new THREE.Vector3(-.38+(i<4?i:0)*.068,2.25,-.48)));
        const networkPorts=[0,1,2,3,8,9].map(i=>byId.pecasTI.g.localToWorld(new THREE.Vector3(-.38+i*.068,2.25,-.48)));
        const extraSignature=JSON.stringify(extraPorts.concat(networkPorts).map(p=>p.toArray()));
        if(extraRackWiring.signature!==extraSignature) {
          extraRackWiring.signature=extraSignature;
          extraRackWiring.meshes.forEach(mesh=>{mesh.removeFromParent();mesh.geometry.dispose();});extraRackWiring.meshes=[];
          extraPorts.forEach((port,i)=>{
            const dest=networkPorts[i], h=3.17-i*.027, sideX=9.28-i*.035;
            const points=[port,new THREE.Vector3(port.x,h,port.z),new THREE.Vector3(sideX,h,port.z),new THREE.Vector3(sideX,h,dest.z),new THREE.Vector3(dest.x,h,dest.z),dest];
            const curve=new THREE.CurvePath();for(let j=1;j<points.length;j++)curve.add(new THREE.LineCurve3(points[j-1],points[j]));
            const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.016,6,false),blueCableMaterial);
            stationCables.add(mesh);extraRackWiring.meshes.push(mesh);
          });
        }
        const modemPort=byId.modemWifi.g.localToWorld(new THREE.Vector3(-.13,-.13,.05));
        const rackPort=byId.pecasTI.g.localToWorld(new THREE.Vector3(-.38+11*.068,2.25,-.48));
        const uplinkSignature=modemPort.toArray().concat(rackPort.toArray()).join(',');
        if(modemUplink.signature!==uplinkSignature) {
          modemUplink.signature=uplinkSignature;
          modemUplink.meshes.forEach(mesh=>{mesh.removeFromParent();mesh.geometry.dispose();});modemUplink.meshes=[];
          const h=3.195;
          const sections=[
            {side:'back',points:[modemPort,new THREE.Vector3(modemPort.x,modemPort.y-.08,modemPort.z),new THREE.Vector3(modemPort.x-.22,modemPort.y-.08,modemPort.z),new THREE.Vector3(modemPort.x-.22,h,-3.33),new THREE.Vector3(9.36,h,-3.33)]},
            {side:'right',points:[new THREE.Vector3(9.36,h,-3.33),new THREE.Vector3(9.36,h,rackPort.z),new THREE.Vector3(rackPort.x,h,rackPort.z),rackPort]}
          ];
          for(const section of sections) {
            const curve=new THREE.CurvePath();for(let i=1;i<section.points.length;i++)curve.add(new THREE.LineCurve3(section.points[i-1],section.points[i]));
            const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.018,6,false),blueCableMaterial);
            stationCables.add(mesh);modemUplink.meshes.push(mesh);
          }
        }
        for(const link of cableConnections) {
          const target=link.id==='pc'?byId.pc.g:byId[link.id].g.userData.networkPc;
          const end=target.localToWorld(new THREE.Vector3(.16,.23,.3));
          const source=byId.pecasTI.g.localToWorld(new THREE.Vector3(-.38+(link.index+4)*.068,2.25,-.48));
          const signature=source.toArray().concat(end.toArray()).join(',');if(signature===link.signature)continue;link.signature=signature;
          const height=3.17-link.index*.027;
          const backZ=-3.36, leftX=-4.36, frontZ=8.36;
          let dropX=end.x;
          if(link.id==='pc') {
            const blockedDrop=x=>objects.some(o=>o.kind==='wallBack' && (()=>{const b=footprint(o);return x>b.min.x-.12 && x<b.max.x+.12;})());
            for(let step=0;step<90 && blockedDrop(dropX);step++) {
              const distance=Math.ceil((step+1)/2)*.1;
              const candidate=end.x+(step%2 ? -distance : distance);
              if(candidate>-4.25 && candidate<4.25 && !blockedDrop(candidate))dropX=candidate;
            }
          }
          const sections=[
            {side:'right',points:[source,new THREE.Vector3(source.x,height,source.z),new THREE.Vector3(9.39,height,source.z),new THREE.Vector3(9.39,height,backZ)]}
          ];
          if(link.id==='pc') {
            sections.push({side:'back',points:[new THREE.Vector3(9.39,height,backZ),new THREE.Vector3(dropX,height,backZ),new THREE.Vector3(dropX,end.y,backZ),new THREE.Vector3(end.x,end.y,backZ),end]});
          } else {
            sections.push({side:'back',points:[new THREE.Vector3(9.39,height,backZ),new THREE.Vector3(leftX,height,backZ)]});
            sections.push({side:'left',points:[new THREE.Vector3(leftX,height,backZ),new THREE.Vector3(leftX,height,frontZ)]});
            sections.push({side:'front',points:[new THREE.Vector3(leftX,height,frontZ),new THREE.Vector3(end.x,height,frontZ),new THREE.Vector3(end.x,end.y,frontZ),end]});
          }
          link.mesh.visible=false;
          for(const mesh of link.wallMeshes){mesh.removeFromParent();mesh.geometry.dispose();}
          link.wallMeshes=[];
          for(const section of sections) {
            const curve=new THREE.CurvePath();
            for(let i=1;i<section.points.length;i++)curve.add(new THREE.LineCurve3(section.points[i-1],section.points[i]));
            const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.018,6,false),blueCableMaterial);
            stationCables.add(mesh);link.wallMeshes.push(mesh);
          }
        }
      }
      // Aberturas reais nas paredes laterais, com caixilho e peitoril.
      function sideWindow(side,z,width,height,centerY=2.05) {
        const parent=roomWalls[side].group,x=side==='left'?-4.5:9.5;
        const wallMesh=parent.children.find(mesh=>mesh.isMesh && Math.abs(mesh.position.x-x)<.03 && Math.abs(mesh.position.y-1.65)<.01 && Math.abs(z-mesh.position.z)+width/2 < (mesh.geometry.parameters.depth||0)/2);
        if(!wallMesh)return;
        const span=wallMesh.geometry.parameters.depth;
        const shape=new THREE.Shape();shape.moveTo(-span/2,-1.65);shape.lineTo(span/2,-1.65);shape.lineTo(span/2,1.65);shape.lineTo(-span/2,1.65);shape.closePath();
        const hx=-(z-wallMesh.position.z),hy=centerY-1.65;
        const hole=new THREE.Path();hole.moveTo(hx-width/2,hy-height/2);hole.lineTo(hx-width/2,hy+height/2);hole.lineTo(hx+width/2,hy+height/2);hole.lineTo(hx+width/2,hy-height/2);hole.closePath();shape.holes.push(hole);
        const geometry=new THREE.ExtrudeGeometry(shape,{depth:.14,bevelEnabled:false});geometry.rotateY(Math.PI/2);geometry.translate(-.07,0,0);wallMesh.geometry.dispose();wallMesh.geometry=geometry;
        const frame=new THREE.Group();frame.userData.wallAttachment=true;frame.position.set(x,centerY,z);frame.rotation.y=side==='left'?Math.PI/2:-Math.PI/2;parent.add(frame);
        const aluminum=M('#293d47',.7,.3), sill=M('#d6d9d3');
        for(const xx of [-width/2,width/2])box(frame,.055,height+.1,.2,aluminum,xx,0,0,.005);
        for(const yy of [-height/2,height/2])box(frame,width+.1,.055,.2,aluminum,0,yy,0,.005);
        box(frame,.035,height,.13,aluminum,0,0,.03,.003);
        box(frame,width,.025,.13,aluminum,0,0,.03,.003);
        box(frame,width+.2,.055,.34,sill,0,-height/2-.04,.07,.008);
        const windowGlass=new THREE.Mesh(new THREE.PlaneGeometry(width-.06,height-.06),new THREE.MeshPhysicalMaterial({color:'#bbdfe9',transparent:true,opacity:.12,roughness:.15,metalness:.1,depthWrite:false,side:THREE.DoubleSide}));frame.add(windowGlass);
        box(frame,.018,.13,.035,sill,.09,-.1,.12,.003);
        // Cortinas com pregas modeladas, presas ao mesmo grupo da janela.
        const curtainCloth=M(height<1?'#d6d4c8':'#6e8991',0,1);curtainCloth.side=THREE.DoubleSide;
        const railMaterial=M('#3c4c55',.65,.4),railY=height/2+.13;
        const rail=cyl(frame,.014,width+.42,railMaterial,0,railY,.21,12);rail.rotation.z=Math.PI/2;
        for(const direction of [-1,1]) {
          sphere(frame,.026,railMaterial,direction*(width/2+.23),railY,.21);
          const panelWidth=Math.min(.43,width*.27),panelHeight=height+.15;
          const geometry=new THREE.PlaneGeometry(panelWidth,panelHeight,24,12),vertices=geometry.attributes.position;
          for(let i=0;i<vertices.count;i++) {
            const u=(vertices.getX(i)+panelWidth/2)/panelWidth,v=(vertices.getY(i)+panelHeight/2)/panelHeight;
            vertices.setZ(i,Math.cos(u*Math.PI*10)*.022*(.75+.25*(1-v)));
            vertices.setY(i,vertices.getY(i)+Math.cos(u*Math.PI*10)*.008*(1-v));
          }
          geometry.computeVertexNormals();const cloth=new THREE.Mesh(geometry,curtainCloth);
          cloth.position.set(direction*(width/2-panelWidth*.28),-.015,.22);cloth.castShadow=true;cloth.receiveShadow=true;frame.add(cloth);
          for(let ring=0;ring<5;ring++) {
            const loop=new THREE.Mesh(new THREE.TorusGeometry(.019,.003,4,10),railMaterial);
            loop.position.set(cloth.position.x-panelWidth*.43+ring*panelWidth*.215,railY-.012,.21);frame.add(loop);
          }
          box(frame,panelWidth+.015,.024,.015,M('#a9b9b9'),cloth.position.x,-panelHeight*.13,.25,.004);
        }

      }
      sideWindow('left',6,2.5,1.5);
      sideWindow('right',6,2.5,1.5);
      sideWindow('right',1.7,1.25,.85,2.55);
      // Divisórias internas não dependem da orientação das paredes externas.
      const interiorSidePartitions=new THREE.Group();
      scene.add(interiorSidePartitions);
      for(const child of [...roomWalls.right.group.children]) {
        if(child.position.x<8)interiorSidePartitions.attach(child);
      }
      const rearRoomPartitions = new THREE.Group();
      scene.add(rearRoomPartitions);
      for(const mesh of [...roomWalls.front.group.children]) {
        if(mesh.isMesh && (Math.abs(mesh.position.z)<.08 || Math.abs(mesh.position.z-3.5)<.08)) {
          rearRoomPartitions.attach(mesh);
        }
      }
      // Galeria na parede de fundo da sala dos computadores.
      function officeFrame(id,label,x,width,height) {
        const group=item(id,label,'wallOffice',x,2.05,3.6,label);
        rearRoomPartitions.add(group);
        box(group,width+.1,height+.1,.065,M('#202a31',.55,.35),0,0,0,.012);
        box(group,width+.035,height+.035,.018,M('#202a31'),0,0,.04,.004);
        const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.round(1200*height/width);
        const ctx=canvas.getContext('2d');ctx.fillStyle='#f0eee6';ctx.fillRect(0,0,canvas.width,canvas.height);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
        const face=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));face.position.z=.052;group.add(face);
        return {group,canvas,ctx,texture};
      }
      function officePortrait(id,label,x,file,width,height) {
        const frame=officeFrame(id,label,x,width,height);
        new THREE.TextureLoader().load(new URL('../assets/'+file,import.meta.url).href,source=>{
          const image=source.image;
          const scale=Math.max(frame.canvas.width/image.width,frame.canvas.height/image.height);
          const w=image.width*scale,h=image.height*scale;
          frame.ctx.drawImage(image,(frame.canvas.width-w)/2,(frame.canvas.height-h)/2,w,h);
          frame.texture.needsUpdate=true;source.dispose();
        },undefined,error=>console.warn('Falha ao carregar '+file,error));
      }
      const npcBoard=officeFrame('lousaNPCs','Lousa de planejamento da equipe',-2.9,2.25,1.4);
      const boardCtx=npcBoard.ctx;
      boardCtx.fillStyle='#fffefa';boardCtx.fillRect(0,0,npcBoard.canvas.width,npcBoard.canvas.height);
      boardCtx.fillStyle='#24556b';boardCtx.font='bold 48px sans-serif';boardCtx.fillText('GUEDESSEC / SPRINT DO LAB',55,80);
      boardCtx.strokeStyle='#539b83';boardCtx.lineWidth=4;boardCtx.beginPath();boardCtx.moveTo(55,110);boardCtx.lineTo(1145,110);boardCtx.stroke();
      boardCtx.font='32px sans-serif';
      ['Vitoria: interface e testes','Xandy: rede e deploy','Alex: seguranca e backups','Revisar codigo antes do deploy','Documentar cada melhoria'].forEach((line,i)=>boardCtx.fillText((i<3?'[ ] ':'-> ')+line,65,180+i*82));
      boardCtx.fillStyle='#3a8b70';boardCtx.font='bold 30px sans-serif';boardCtx.fillText('PLANEJAR  >  PROGRAMAR  >  TESTAR',65,650);npcBoard.texture.needsUpdate=true;
      box(npcBoard.group,.75,.025,.13,metal,0,-.75,.06,.005);
      for(let i=0;i<3;i++)box(npcBoard.group,.19,.022,.025,M(['#3576a2','#a84f54','#263c3c'][i]),-.22+i*.22,-.723,.09,.004);
      officePortrait('quadroMaquiavel','Nicolau Maquiavel',-.35,'Nicolau.jpg',1.65,2.05);
      officePortrait('quadroCodejohn','CodeJOHN',4.85,'codejohn.jpeg',1.8,1.65);
      officePortrait('quadroLinux','Linux',7.2,'linux.jpg',1.65,2.05);
      const githubFrame=officeFrame('githubPerfil','GitHub / CodeJohnn',2,2.8,2.1);
      const githubState={data:null,avatar:null,updated:null,error:null,busy:false};
      function drawGithubProfile() {
        const {ctx,canvas,texture}=githubFrame;
        if(canvas.width!==1600){canvas.width=1600;canvas.height=1200;}
        const data=githubState.data;
        ctx.fillStyle='#0d1117';ctx.fillRect(0,0,1600,1200);
        function text(value,x,y,size=20,color='#c9d1d9',bold=false){ctx.fillStyle=color;ctx.font=(bold?'bold ':'')+size+'px sans-serif';ctx.textAlign='left';ctx.fillText(value,x,y);}
        function rule(x,y,w){ctx.strokeStyle='#30363d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();}
        function panel(x,y,w,h){ctx.strokeStyle='#30363d';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);}
        function paragraph(value,x,y,width,size=20,maxLines=5){ctx.font=size+'px sans-serif';let line='',row=0;for(const word of value.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){text(line,x,y+row*31,size);line=word;row++;if(row>=maxLines)return y+row*31;}else line=next;}if(line)text(line,x,y+row*31,size);return y+(row+1)*31;}
        ctx.fillStyle='#010409';ctx.fillRect(0,0,1600,90);
        text('GitHub',28,43,28,'#f0f6fc',true);text('CodeJohnn',165,43,22,'#f0f6fc',true);
        text('Overview     Repositories '+(data?.public_repos??'')+'     Projects     Packages     Stars',28,81,18);
        ctx.fillStyle='#f78166';ctx.fillRect(25,88,91,3);rule(0,92,1600);
        const sx=50,mainX=430,mainWidth=1120;
        if(githubState.avatar){ctx.save();ctx.beginPath();ctx.arc(218,285,150,0,Math.PI*2);ctx.clip();ctx.drawImage(githubState.avatar,68,135,300,300);ctx.restore();}
        else {ctx.fillStyle='#263342';ctx.beginPath();ctx.arc(218,285,150,0,Math.PI*2);ctx.fill();text('CJ',170,312,70,'#7ee787',true);}
        text(data?.name||'Joao Mateus',sx,480,30,'#e6edf3',true);text('CodeJohnn',sx,516,24,'#8b949e');
        paragraph(data?.bio||'Desenvolvedor',sx,563,325,20,3);
        panel(sx,620,315,42);text('Follow / Ver perfil',120,648,18);
        text((data?.followers??'--')+' followers  /  '+(data?.following??'--')+' following',sx,705,18);
        if(data?.location)text(data.location,sx,750,19);
        text('github.com/CodeJohnn',sx,794,18,'#58a6ff');rule(sx,828,315);
        text('Perfil publico',sx,866,20,'#e6edf3',true);
        paragraph('Clique neste quadro para abrir o perfil completo no GitHub.',sx,905,310,18,4);
        panel(mainX,130,mainWidth,650);text('CodeJohnn / README.md',mainX+25,169,17,'#8b949e');
        const clean=(githubState.readme||'').replace(/<[^>]*>/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[#*_\x60]/g,'').replace(/https?:\/\/\S+/g,'').replace(/\s+/g,' ').trim();
        text('CODE JOHN...',mainX+26,228,36,'#e6edf3',true);rule(mainX+25,250,1070);
        text('Desenvolvedor Web / Full Stack',mainX+25,295,24,'#e6edf3',true);
        paragraph(clean||data?.bio||'Carregando apresentacao publica do perfil...',mainX+25,340,1060,20,7);
        rule(mainX+25,584,1070);text('Tecnologias e projetos',mainX+25,625,25,'#e6edf3',true);
        ['HTML','CSS','JS','React','Node','Java','Git','Linux'].forEach((label,i)=>{const x=mainX+25+i*130;ctx.fillStyle=['#d85430','#1677ad','#cdbb30','#216f8a','#427b39','#8b5434','#b7473e','#626f7a'][i];ctx.fillRect(x,652,110,55);text(label,x+12,687,21,'#ffffff',true);});
        text('Atualizacao publica / README e repositorios',mainX+25,751,17,'#8b949e');
        text('Popular repositories',mainX,830,24,'#e6edf3');
        const repos=githubState.repos||[];
        for(let i=0;i<6;i++){const x=mainX+(i%2)*570,y=855+Math.floor(i/2)*91;panel(x,y,550,78);const repo=repos[i];text(repo?.name||'...',x+18,y+28,20,'#58a6ff',true);text((repo?.language||'Repository')+'   /   '+(repo?.stargazers_count??0)+' stars',x+18,y+59,16,'#8b949e');}
        text(githubState.error?'Conexao indisponivel / mantendo ultima leitura':githubState.updated?'Dados atualizados '+githubState.updated.toLocaleTimeString('pt-BR'):'Carregando GitHub...',50,1171,17,githubState.error?'#e8b76a':'#8b949e');
        texture.needsUpdate=true;
      }
      let githubAvatarPriority=-1;
      const githubAvatarLoading=new Set();
      function loadGithubAvatar(url,priority) {
        if(!url || githubAvatarLoading.has(url))return;
        githubAvatarLoading.add(url);
        const image=new Image();image.crossOrigin='anonymous';
        image.onload=()=>{
          githubAvatarLoading.delete(url);
          if(priority<githubAvatarPriority)return;
          githubAvatarPriority=priority;githubState.avatar=image;drawGithubProfile();
        };
        image.onerror=()=>{githubAvatarLoading.delete(url);console.warn('Foto do GitHub indisponivel; mantendo a alternativa local.');};
        image.src=url;
      }
      async function refreshGithubProfile() {
        if(githubState.busy||document.hidden)return;
        githubState.busy=true;
        const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
        try {
          const response=await fetch('https://api.github.com/users/CodeJohnn',{signal:controller.signal,headers:{Accept:'application/vnd.github+json'}});
          if(!response.ok)throw Error('GitHub HTTP '+response.status);
          githubState.data=await response.json();githubState.error=null;githubState.updated=new Date();
          loadGithubAvatar(githubState.data.avatar_url,2);
          drawGithubProfile();
          const details=await Promise.allSettled([
            fetch('https://api.github.com/repos/CodeJohnn/CodeJohnn/readme',{signal:controller.signal,headers:{Accept:'application/vnd.github.raw+json'}}).then(r=>{if(!r.ok)throw Error('README');return r.text();}),
            fetch('https://api.github.com/users/CodeJohnn/repos?sort=updated&per_page=6',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('repos');return r.json();})
          ]);
          if(details[0].status==='fulfilled')githubState.readme=details[0].value;
          if(details[1].status==='fulfilled')githubState.repos=details[1].value;

        }catch(error){githubState.error=error.message;}finally{clearTimeout(timeout);githubState.busy=false;drawGithubProfile();}
      }
      drawGithubProfile();
      loadGithubAvatar(new URL('../assets/rostos/codejohn.png',import.meta.url).href,0);
      loadGithubAvatar('https://github.com/CodeJohnn.png?size=512',1);
      refreshGithubProfile();setInterval(refreshGithubProfile,120000);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshGithubProfile();});

      // Falhas simuladas do laboratório: não interrompem sites ou vídeos reais.
      const serverIncident={remaining:65+Math.random()*45,down:false,rackId:null,beep:0};
      const serverNotice=document.createElement('div');serverNotice.hidden=true;
      serverNotice.setAttribute('role','status');serverNotice.setAttribute('aria-live','polite');
      serverNotice.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:6;padding:12px 18px;border-radius:12px;background:#381b22;color:#ffe9ed;border:1px solid #d96677;max-width:85vw;font:600 13px system-ui;pointer-events:none';
      document.body.append(serverNotice);
      function updateServerIncident(dt,t){
        if(edit||document.hidden)return;
        if(!serverIncident.down)serverIncident.remaining-=dt;
        if(serverIncident.remaining<=0||serverIncident.repairRequested){
          serverIncident.repairRequested=false;
          serverIncident.down=!serverIncident.down;
          if(serverIncident.down){
            serverIncident.rackId=['bancadaTI','instrumentosTI','rackExtraTI','pecasTI'][Math.floor(Math.random()*4)];
            serverIncident.remaining=Infinity;serverIncident.beep=0;serverIncident.id=(serverIncident.id||0)+1;
          }else serverIncident.remaining=100+Math.random()*100;
          const rack=byId[serverIncident.rackId].g,display=rack.userData.statusDisplay;
          if(display){
            display.ctx.fillStyle='#071924';display.ctx.fillRect(0,52,512,124);
            display.ctx.fillStyle=serverIncident.down?'#ff6b7d':'#75e7cd';display.ctx.font='22px monospace';
            display.ctx.fillText(serverIncident.down?'SERVER OFFLINE':'SYSTEM ONLINE',20,88);
            display.ctx.fillText(serverIncident.down?'CONNECTION LOST':'CPU  24%   RAM  38%',20,124);
            display.ctx.fillText(serverIncident.down?'LOGIC CHECK REQUIRED':'NETWORK / CONNECTED',20,160);display.texture.needsUpdate=true;
          }
          serverNotice.hidden=false;
          serverNotice.textContent=serverIncident.down?'ALERTA: '+byId[serverIncident.rackId].label+' caiu. Abra o terminal e resolva o desafio.':'Servidor recuperado. Conex\u00e3o restabelecida.';
          if(!serverIncident.down)serverIncident.noticeTime=5;
        }
        if(serverIncident.down){
          serverIncident.beep-=dt;if(serverIncident.beep<=0){interactionAudio.play('serverAlert');serverIncident.beep=2.4;}
        }else if(serverIncident.noticeTime>0){serverIncident.noticeTime-=dt;if(serverIncident.noticeTime<=0)serverNotice.hidden=true;}
        for(const id of ['bancadaTI','instrumentosTI','rackExtraTI','pecasTI']){
          const rack=byId[id].g,failed=serverIncident.down&&id===serverIncident.rackId;
          rack.userData.beacon.material.color.setHex(failed?(Math.sin(t*.012)>0?0xff183b:0x591021):0x21352b);
        }
      }
      const wallOcclusionState = new Map();
      const wallRaycaster = new THREE.Raycaster();
      const wallOccluders = [...new Set([backWall, leftWall, rightWall, ...apartmentWalls])];
      function updateActiveRoomWalls() {
        for (const [object, visible] of wallOcclusionState) object.visible = visible;
        wallOcclusionState.clear();

        const backVisible = Math.cos(yaw) >= 0;
        const leftVisible = Math.sin(yaw) >= 0;
        roomWalls.back.group.visible = backVisible;
        roomWalls.front.group.visible = !backVisible;
        roomWalls.left.group.visible = leftVisible;
        roomWalls.right.group.visible = !leftVisible;
        rearRoomPartitions.visible = true;
        interiorSidePartitions.visible = true;
        for (const o of objects) {
          if (o.kind === 'wallBack') o.g.visible = backVisible;
          else if (o.kind === 'wallLeft') o.g.visible = leftVisible;
        }

        // Verifica a area do comodo, em vez de apenas um raio no centro do boneco.
        const x=avatar.position.x,z=avatar.position.z;
        const room=z>=3.5?{x:2.5,z:6,w:14,d:5}:x>4.5?(z<0?{x:7,z:-1.75,w:5,d:3.5}:{x:7,z:1.75,w:5,d:3.5}):{x:0,z:0,w:9,d:7};
        scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
        const samples=[avatar.position.clone().add(new THREE.Vector3(0,.9,0))];
        for(const dx of [-.3,0,.3])for(const dz of [-.3,0,.3])samples.push(new THREE.Vector3(room.x+dx*room.w,1,room.z+dz*room.d));
        const hide=object=>{if(!wallOcclusionState.has(object))wallOcclusionState.set(object,object.visible);object.visible=false;};
        const attachmentSet=new Set(objects.filter(o=>o.kind.startsWith('wall')).map(o=>o.g));
        // Inclui batentes, guarnicoes, peitoris e grupos de janelas, alem dos quadros.
        for(const parent of [rearRoomPartitions,interiorSidePartitions,...Object.values(roomWalls).map(entry=>entry.group)]) {
          for(const child of parent.children)if(!wallOccluders.includes(child))attachmentSet.add(child);
        }
        scene.traverse(object=>{if(object.userData.wallAttachment)attachmentSet.add(object);});
        const attachments=[...attachmentSet];
        function hideWall(mesh) {
          hide(mesh);
          const bounds=new THREE.Box3().setFromObject(mesh);
          const alongX=bounds.max.x-bounds.min.x>bounds.max.z-bounds.min.z;
          const wallPlane=alongX?(bounds.min.z+bounds.max.z)/2:(bounds.min.x+bounds.max.x)/2;
          for(const attachment of attachments) {
            const position=attachment.getWorldPosition(new THREE.Vector3());
            const nearPlane=Math.abs((alongX?position.z:position.x)-wallPlane)<.28;
            const attachmentBounds=new THREE.Box3().setFromObject(attachment);
            const within=alongX?attachmentBounds.max.x>=bounds.min.x-.12&&attachmentBounds.min.x<=bounds.max.x+.12:attachmentBounds.max.z>=bounds.min.z-.12&&attachmentBounds.min.z<=bounds.max.z+.12;
            if(nearPlane&&within)hide(attachment);
          }
        }
        // Abre as divisorias da frente assim que o jogador muda de comodo.
        // Nao precisa esperar o corpo ficar exatamente atras de um trecho solido.
        for(const mesh of wallOccluders) {
          if(!isSceneVisible(mesh))continue;
          const bounds=new THREE.Box3().setFromObject(mesh);
          const alongX=bounds.max.x-bounds.min.x>bounds.max.z-bounds.min.z;
          const axis=alongX?'z':'x',wallPosition=(bounds.min[axis]+bounds.max[axis])/2;
          const roomPosition=room[axis],half=alongX?room.d/2:room.w/2;
          const atRoomBoundary=Math.abs(Math.abs(wallPosition-roomPosition)-half)<.22;
          const overlap=alongX?bounds.max.x>room.x-room.w/2+.05&&bounds.min.x<room.x+room.w/2-.05:bounds.max.z>room.z-room.d/2+.05&&bounds.min.z<room.z+room.d/2-.05;
          if(atRoomBoundary&&overlap&&(camera.position[axis]-wallPosition)*(roomPosition-wallPosition)<0) {
            hideWall(mesh);
            for(const sibling of mesh.parent.children)if(sibling.isMesh&&Math.abs(sibling.position.x-mesh.position.x)<.025&&Math.abs(sibling.position.z-mesh.position.z)<.025&&sibling.position.y>=3.25)hide(sibling);
          }
        }
        const blockers=wallOccluders.filter(mesh=>isSceneVisible(mesh));
        for(const target of samples) {
          const direction=target.clone().sub(camera.position),distance=direction.length();
          if(distance<.1)continue;
          wallRaycaster.set(camera.position,direction.normalize());
          for(const hit of wallRaycaster.intersectObjects(blockers,false)) {
            if(hit.distance>=distance-.15)break;
            const object=hit.object;hideWall(object);
            // Oculta junto apenas o arremate da mesma parede.
            for(const sibling of object.parent.children) {
              if(sibling!==object && sibling.isMesh && Math.abs(sibling.position.x-object.position.x)<.025 && Math.abs(sibling.position.z-object.position.z)<.025 && sibling.position.y>=3.25)hide(sibling);
            }
            object.geometry.computeBoundingBox();const bounds=new THREE.Box3().setFromObject(object);
            for(const o of objects)if(o.kind.startsWith('wall')) {
              const pos=o.g.getWorldPosition(new THREE.Vector3());
              const alongX=bounds.max.x-bounds.min.x>bounds.max.z-bounds.min.z;
              if(alongX?Math.abs(pos.z-object.position.z)<.22&&pos.x>=bounds.min.x&&pos.x<=bounds.max.x:Math.abs(pos.x-object.position.x)<.22&&pos.z>=bounds.min.z&&pos.z<=bounds.max.z)hide(o.g);
            }
          }
        }
      }
      // Pequenos objetos acompanham as mesas quando a organizacao muda.
      const coffeeCeramic=M('#e7dfce',.05,.45),coffeeDrink=M('#382116',.02,.45),paperStock=M('#eee9dc',0,.95);
      const interactiveCups=[];
      function coffeeCup(parent,x,y,z,color=coffeeCeramic) {
        const cup=new THREE.Group();cup.position.set(x,y,z);cup.userData.interaction='coffee';cup.userData.restY=y;cup.userData.sipUntil=0;interactiveCups.push(cup);parent.add(cup);
        cyl(cup,.082,.014,color,0,.007,0,20);
        const body=new THREE.Mesh(new THREE.CylinderGeometry(.054,.043,.11,20,1,true),color);body.position.y=.066;body.castShadow=true;cup.add(body);
        const rim=new THREE.Mesh(new THREE.TorusGeometry(.054,.005,6,24),color);rim.rotation.x=Math.PI/2;rim.position.y=.122;cup.add(rim);
        cyl(cup,.048,.004,coffeeDrink,0,.113,0,20);
        const handle=new THREE.Mesh(new THREE.TorusGeometry(.026,.007,6,16,Math.PI*1.6),color);handle.position.set(.065,.07,0);handle.rotation.z=-Math.PI*.3;cup.add(handle);
      }
      function documents(parent,x,y,z) {
        const stack=new THREE.Group();stack.position.set(x,y,z);stack.rotation.y=-.12;parent.add(stack);
        for(let page=0;page<5;page++) {const sheet=box(stack,.27,.002,.35,paperStock,(page%2)*.007,page*.002,0);sheet.rotation.y=(page-2)*.018;}
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#eee9dc';ctx.fillRect(0,0,256,320);ctx.fillStyle='#3e555f';ctx.font='bold 18px sans-serif';ctx.fillText('GUEDESSEC',22,33);ctx.font='11px sans-serif';ctx.fillText('RELATORIO DO LAB',22,56);
        for(let line=0;line<12;line++){ctx.fillStyle=line%4?'#a3a7a0':'#637f85';ctx.fillRect(22,80+line*15,line%3===0?150:210,3);}
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
        const top=new THREE.Mesh(new THREE.PlaneGeometry(.27,.35),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));top.rotation.x=-Math.PI/2;top.position.y=.011;stack.add(top);
        const pen=box(stack,.011,.011,.19,M('#294858'),.17,.014,.025,.003);pen.rotation.y=.2;
      }
      function snackBag(parent,x,y,z,index) {
        const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=.15;parent.add(group);
        const packColor=M(['#b64b38','#c49b3b','#426b81'][index%3],.08,.65);
        box(group,.14,.19,.055,packColor,0,.095,0,.016);
        for(const yy of [.015,.178])box(group,.145,.012,.06,packColor,0,yy,0,.003);
        const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle=['#b64b38','#c49b3b','#426b81'][index%3];ctx.fillRect(0,0,128,160);ctx.fillStyle='#fff1c4';ctx.font='bold 19px sans-serif';ctx.textAlign='center';ctx.fillText('SNACK',64,42);ctx.fillStyle='#e7c677';for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(37+i*17,100+(i%2)*12,12,21,.4,0,Math.PI*2);ctx.fill();}
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(.125,.16),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));label.position.set(0,.096,.029);group.add(label);
      }
      [byId.mesa.g,...['setupVitoria','setupXandy','setupAlex'].map(id=>byId[id].g)].forEach((desk,i)=>{
        coffeeCup(desk,1.68,1.12,.34,i===1?M('#d8b1bd',.02,.5):coffeeCeramic);
        documents(desk,-1.29,1.12,.32);snackBag(desk,1.45,1.12,-.3,i);
      });
      coffeeCup(readingDesk,.54,.947,.26);documents(consoleDesk,.64,1.015,.16);
      const ac=item('arCondicionado','Ar-condicionado da sala','wallOffice',4.30,2.95,1.85,'Ar-condicionado split sobre a porta do banheiro.');ac.rotation.y=-Math.PI/2;roomWalls.right.group.add(ac);
      const acWhite=M('#e6e9e7',.08,.55),acInner=M('#43545b');
      box(ac,1.12,.34,.21,acWhite,0,0,0,.04);box(ac,1.0,.052,.035,acInner,0,-.102,.109,.009);
      for(let i=0;i<5;i++){const slat=box(ac,.94,.008,.04,acWhite,0,-.08-i*.008,.128,.002);slat.rotation.x=-.25;}
      const displayCanvas=document.createElement('canvas');displayCanvas.width=128;displayCanvas.height=64;const acContext=displayCanvas.getContext('2d');acContext.fillStyle='#d7e0df';acContext.fillRect(0,0,128,64);acContext.fillStyle='#3c767a';acContext.font='40px monospace';acContext.fillText('23',20,45);
      const acTexture=new THREE.CanvasTexture(displayCanvas);acTexture.colorSpace=THREE.SRGBColorSpace;const acDisplay=new THREE.Mesh(new THREE.PlaneGeometry(.13,.065),new THREE.MeshBasicMaterial({map:acTexture,toneMapped:false}));acDisplay.position.set(.36,.025,.109);ac.add(acDisplay);
      const energyFridge=item('geladeiraEnergeticos','Geladeira de energeticos','floor',3.95,0,2.98,'Geladeira de bebidas com porta de vidro, iluminacao interna e latas de energetico. Clique para abrir ou fechar.');
      energyFridge.rotation.y=-Math.PI/2;
      const fridgeShell=M('#17252e',.45,.4),fridgeInside=M('#354851',.2,.65),canSilver=M('#b5c4cd',.75,.28);
      box(energyFridge,.82,.09,.76,fridgeShell,0,.065,0,.012);
      box(energyFridge,.82,.1,.76,fridgeShell,0,1.77,0,.012);
      for(const x of [-.385,.385])box(energyFridge,.06,1.62,.76,fridgeShell,x,.91,0,.012);
      box(energyFridge,.72,1.58,.045,fridgeInside,0,.91,-.36);
      box(energyFridge,.7,.07,.65,fridgeInside,0,.15,0);
      for(const x of [-.34,.34])box(energyFridge,.012,1.48,.02,glow('#8cdaf7'),x,.93,.265,.003);
      const canColors=[M('#61c398',.4,.38),M('#5e9ac9',.45,.35),M('#a177ba',.4,.4)];
      const canGeometry=new THREE.CylinderGeometry(.043,.043,.145,16),lidGeometry=new THREE.CylinderGeometry(.041,.041,.007,16);
      for(let row=0;row<4;row++) {
        const y=.25+row*.34;box(energyFridge,.7,.018,.62,canSilver,0,y,-.01,.003);
        for(let col=0;col<5;col++) {
          const x=-.25+col*.125;
          const can=new THREE.Mesh(canGeometry,canColors[(row+col)%canColors.length]);can.position.set(x,y+.084,.15);energyFridge.add(can);
          const lid=new THREE.Mesh(lidGeometry,canSilver);lid.position.set(x,y+.16,.15);energyFridge.add(lid);
          box(energyFridge,.014,.07,.005,glow('#d8f1e8'),x,y+.09,.194,.001);
          box(energyFridge,.019,.012,.006,fridgeShell,x,y+.163,.15,.002);
        }
      }
      const energySignCanvas=document.createElement('canvas');energySignCanvas.width=512;energySignCanvas.height=128;const energySign=energySignCanvas.getContext('2d');energySign.fillStyle='#101e28';energySign.fillRect(0,0,512,128);energySign.fillStyle='#9feacb';energySign.font='bold 40px sans-serif';energySign.textAlign='center';energySign.fillText('LAB / ENERGY',256,62);energySign.fillStyle='#7aafc2';energySign.font='18px sans-serif';energySign.fillText('BEBIDAS GELADAS',256,100);
      const energySignTexture=new THREE.CanvasTexture(energySignCanvas);energySignTexture.colorSpace=THREE.SRGBColorSpace;
      const energySignFace=new THREE.Mesh(new THREE.PlaneGeometry(.72,.18),new THREE.MeshBasicMaterial({map:energySignTexture,toneMapped:false}));energySignFace.position.set(0,1.65,.387);energyFridge.add(energySignFace);
      const fridgeDoor=new THREE.Group();fridgeDoor.position.set(-.365,.85,.388);energyFridge.add(fridgeDoor);
      for(const x of [0,.73])box(fridgeDoor,.032,1.38,.04,fridgeShell,x,0,0,.004);
      for(const y of [-.69,.69])box(fridgeDoor,.76,.032,.04,fridgeShell,.365,y,0,.004);
      const doorGlass=new THREE.Mesh(new THREE.PlaneGeometry(.69,1.32),new THREE.MeshPhysicalMaterial({color:'#bfd9e5',transparent:true,opacity:.12,roughness:.15,metalness:.1,depthWrite:false,side:THREE.DoubleSide}));doorGlass.position.x=.365;fridgeDoor.add(doorGlass);
      box(fridgeDoor,.025,.27,.055,canSilver,.66,0,.05,.005);
      for(const x of [-.3,.3])for(const z of [-.27,.27])cyl(energyFridge,.035,.04,black,x,.02,z,12);
      const drinkingCan=new THREE.Group();scene.add(drinkingCan);drinkingCan.visible=false;
      cyl(drinkingCan,.043,.15,M('#235955',.5,.35),0,0,0,20);
      cyl(drinkingCan,.044,.009,canSilver,0,.078,0,20);
      box(drinkingCan,.014,.07,.005,glow('#d8f1e8'),0,0,.044,.001);
      let energyRequest=false,energyDrinkTime=-1;
      let fridgeOpen=false;
      function toggleEnergyFridge(){
        if(energyDrinkTime>=0||energyRequest)return;
        stopInteraction();keys.clear();fridgeOpen=true;interactionAudio.play('fridge');
        energyRequest=true;
        const approach=energyFridge.localToWorld(new THREE.Vector3(0,0,1.1));
        walkTo(approach);
        document.getElementById('status').textContent='Indo pegar um energetico...';
      }
      function updateEnergyDrink(dt){
        if(energyRequest){
          const fridgePosition=energyFridge.getWorldPosition(new THREE.Vector3());
          if(Math.hypot(avatar.position.x-fridgePosition.x,avatar.position.z-fridgePosition.z)<1.65){
            energyRequest=false;energyDrinkTime=0;walkTarget=null;walkPath=[];keys.clear();
            avatar.rotation.y=Math.atan2(fridgePosition.x-avatar.position.x,fridgePosition.z-avatar.position.z);
            drinkingCan.visible=true;interactionAudio.play('fridge');
          }else if(!walkTarget){energyRequest=false;fridgeOpen=false;document.getElementById('status').textContent='Libere o acesso a geladeira para pegar a bebida.';}
        }
        if(energyDrinkTime<0)return;
        energyDrinkTime+=dt;const time=energyDrinkTime;
        const lift=time<.9?time/.9:time<2.8?1:Math.max(0,1-(time-2.8)/.8);
        const hand=new THREE.Vector3(.23-.15*lift,.98+.49*lift,.16+.12*lift);
        const target=new THREE.Group();avatar.add(target);target.position.copy(hand).sub(new THREE.Vector3(.145,.063,.02));
        poseNpcTyping({root:avatar,arms:[arms[1]],forearms:[elbows[1]],upperLength:.28,lowerLength:.265},{userData:{keyboard:target}},0);
        target.removeFromParent();avatar.updateWorldMatrix(true,true);
        drinkingCan.position.copy(avatar.localToWorld(hand));drinkingCan.rotation.set(0,avatar.rotation.y,-lift*.9);
        if(time>=.9&&time-dt<.9)interactionAudio.play('coffee');
        if(time>3.7){energyDrinkTime=-1;drinkingCan.visible=false;fridgeOpen=false;document.getElementById('status').textContent='Energetico tomado!';}
      }
      // Avatar.
      const avatar = new THREE.Group(); scene.add(avatar);
      const skin = M('#bd896c'), shirt = M('#080808'), shirtLight = M('#151515'), pants = M('#17191e'), hair = M('#292725'), shoeMat = M('#20242b'), eyeMat = M('#16191d');
      box(avatar, .34, .2, .22, pants, 0, .7, 0, .055);
      const johnBodyShape=[new THREE.Vector2(.19,0),new THREE.Vector2(.21,.04),new THREE.Vector2(.22,.2),new THREE.Vector2(.24,.35),new THREE.Vector2(.205,.43),new THREE.Vector2(.095,.49)];
      const johnTorso=new THREE.Mesh(new THREE.LatheGeometry(johnBodyShape,24),shirt);johnTorso.position.y=.79;johnTorso.scale.z=.8;johnTorso.castShadow=true;avatar.add(johnTorso);
      function johnLimb(parent,width,length,depth,material,x,y,z) {
        const part=new THREE.Mesh(new THREE.CapsuleGeometry(1,6,5,12),material);part.scale.set(width/2,length/8,depth/2);part.position.set(x,y,z);part.castShadow=true;parent.add(part);return part;
      }
      const johnCollar=new THREE.Mesh(new THREE.TorusGeometry(.078,.014,8,24),shirtLight);johnCollar.rotation.x=Math.PI/2;johnCollar.position.y=1.29;avatar.add(johnCollar);
      box(avatar, .36, .12, .255, black, 0, .81, .004, .025);
      box(avatar, .07, .018, .008, M('#bd9a57'), 0, .81, .136, .003);
      // Estampa GuedesSEC na frente e nas costas da camisa.
      const shirtLogo = new THREE.TextureLoader().load(guedesLogoUrl);
      shirtLogo.colorSpace = THREE.SRGBColorSpace;
      shirtLogo.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const shirtPrintMaterial=new THREE.MeshStandardMaterial({map:shirtLogo,roughness:.95,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
      function addUniformLogo(torso,profile,centerY=.275) {
        function radiusAt(y) {
          for(let i=1;i<profile.length;i++)if(y<=profile[i].y) {
            const t=THREE.MathUtils.clamp((y-profile[i-1].y)/(profile[i].y-profile[i-1].y),0,1);
            return THREE.MathUtils.lerp(profile[i-1].x,profile[i].x,t);
          }
          return profile[profile.length-1].x;
        }
        for(const side of [-1]) {
          const geometry=new THREE.PlaneGeometry(.24,.255,20,20),positions=geometry.attributes.position;
          for(let i=0;i<positions.count;i++) {
            const x=positions.getX(i)*side,y=positions.getY(i)+centerY,r=radiusAt(y);
            positions.setXYZ(i,x,y,side*(Math.sqrt(Math.max(.00001,r*r-x*x))+.0015));
          }
          geometry.computeVertexNormals();
          const print=new THREE.Mesh(geometry,shirtPrintMaterial);torso.add(print);
        }
      }
      function addBlackLabCoat(root) {
        const cloth=M('#080808',0,.94),seam=M('#30343a');
        const profile=[new THREE.Vector2(.205,0),new THREE.Vector2(.208,.06),new THREE.Vector2(.18,.34),new THREE.Vector2(.20,.60),new THREE.Vector2(.17,.68),new THREE.Vector2(.09,.73)];
        const coat=new THREE.Mesh(new THREE.LatheGeometry(profile,24),cloth);
        coat.position.y=.55;coat.scale.z=.8;coat.castShadow=true;root.add(coat);
        addUniformLogo(coat,profile,.49);
        box(root,.008,.46,.009,seam,0,.80,.167,.002);
        for(const side of [-1,1]){
          box(root,.095,.09,.014,cloth,side*.105,.69,.166,.008);
          box(root,.095,.008,.012,seam,side*.105,.733,.176,.002);
        }
        for(const y of [.62,.78,.94])sphere(root,.008,seam,0,y,.176);
        return coat;
      }
      addBlackLabCoat(avatar);
      cyl(avatar, .075, .12, skin, 0, 1.32, 0);
      const playerHead=sphere(avatar,.18,skin,0,1.555,.01);playerHead.scale.set(.88,1.13,.94);
      const playerJaw=sphere(avatar,.125,skin,0,1.465,.035);playerJaw.scale.set(.97,.72,.9);
      const studs=M('#cbd3db',.85,.25),naturalHair=M('#171615',.02,.92);
      const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.184,28,16,0,Math.PI*2,0,1.35),naturalHair);
      hairCap.position.set(0,1.565,.005);hairCap.scale.set(.91,1.13,.95);hairCap.castShadow=true;avatar.add(hairCap);
      for(const side of [-1,1]) {
        const sideburn=sphere(avatar,.035,naturalHair,side*.148,1.595,.022);sideburn.scale.set(.32,1.8,1);

      }
      const playerChin=sphere(avatar,.047,naturalHair,0,1.435,.126);playerChin.scale.set(.72,.72,.4);
      cyl(avatar, .079, .035, shirt, 0, 1.35, 0);
      for (const x of [-.04, 0, .04]) sphere(avatar, .009, studs, x, 1.35, .075);
      // Corrente prateada pendurada no quadril.
      for (let i = 0; i < 9; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(.014, .004, 5, 10), studs);
        link.position.set(.09 + i * .013, .79 - .065 * Math.sin(i / 8 * Math.PI), .145);
        avatar.add(link);
      }
      for (const side of [-1, 1]) {
        const playerEar=sphere(avatar,.034,skin,side*.163,1.55,.005);playerEar.scale.set(.55,1.12,.7);
        const innerEar=sphere(avatar,.019,M('#b67f64'),side*.169,1.55,.017);innerEar.scale.set(.4,1,.6);
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
        johnLimb(hip,.17,.36,.18,pants,0,-.18,0);
        const knee = new THREE.Group();
        knee.position.y = -.36;
        hip.add(knee);
        knees.push(knee);
        sphere(knee, .073, pants, 0, 0, 0);
        johnLimb(knee,.15,.35,.16,pants,0,-.17,0);
        const johnShoe=sphere(knee,.105,shoeMat,0,-.35,.055);johnShoe.scale.set(.9,.7,1.5);
        box(knee, .16, .18, .18, shoeMat, 0, -.25, .005, .02);
        box(knee, .17, .035, .29, black, 0, -.39, .045, .008);
        for (let i = 0; i < 4; i++) box(knee, .065, .008, .012, studs, 0, -.19 - i * .033, .1, .002);
        box(knee, .11, .07, .012, skin, 0, -.015, .079, .008);

        const shoulder = new THREE.Group();
        shoulder.position.set(side * .275, 1.22, 0);
        avatar.add(shoulder);
        arms.push(shoulder);
        sphere(shoulder, .105, shirtLight, 0, 0, 0);
        johnLimb(shoulder,.19,.3,.2,shirt,0,-.145,0);
        const elbow = new THREE.Group();
        elbow.position.y = -.28;
        shoulder.add(elbow);
        elbows.push(elbow);
        sphere(elbow, .055, shirt, 0, 0, 0);
        johnLimb(elbow,.15,.26,.16,shirtLight,0,-.12,0);
        box(elbow, .12, .055, .125, black, 0, -.215, 0, .01);
        for (const x of [-.035, 0, .035]) sphere(elbow, .01, studs, x, -.215, .067);
        const johnHand=sphere(elbow,.05,skin,0,-.265,.015);johnHand.scale.set(.85,1.15,.72);
        for (let finger = 0; finger < 3; finger++) box(elbow, .014, .042, .014, skin, -.02 + finger * .02, -.285, .035, .006);
      }
      const johnCartoonHead=new THREE.Group();johnCartoonHead.position.set(0,1.6,0);avatar.add(johnCartoonHead);
      const headParts=avatar.children.filter(child=>child!==johnCartoonHead && child.position.y>1.41);
      for(const part of headParts){part.position.y-=1.555;johnCartoonHead.add(part);}
      // Substitui os pequenos olhos por olhos expressivos atras dos oculos.
      for(const part of [...johnCartoonHead.children]) {
        if(part.position.z>=.17 && part.position.y>-.12 && part.position.y<.08){part.removeFromParent();}
      }
      for(const side of [-1,1]) {
        const eye=sphere(johnCartoonHead,.035,white,side*.065,.018,.173);eye.scale.set(.85,.83,.48);
        const iris=sphere(johnCartoonHead,.024,M('#5e4635'),side*.065,.018,.19);iris.scale.set(.8,1,.3);
        const pupil=sphere(johnCartoonHead,.014,eyeMat,side*.065,.018,.198);pupil.scale.set(.8,1.2,.3);
        sphere(johnCartoonHead,.006,white,side*.065-.008,.032,.203);
        const glasses=new THREE.Group();glasses.position.set(side*.066,.018,.209);
        for(const y of [-.035,.035])box(glasses,.093,.009,.009,hair,0,y,0,.003);
        for(const x of [-.042,.042])box(glasses,.009,.07,.009,hair,x,0,0,.003);
        box(glasses,.009,.008,.095,hair,side*.045,.024,-.04,.002);johnCartoonHead.add(glasses);
        const angryBrow=box(johnCartoonHead,.058,.016,.014,hair,side*.065,.067,.187,.005);angryBrow.rotation.z=side*.3;
      }
      box(johnCartoonHead,.04,.006,.008,hair,0,.025,.21,.002);
      const johnNose=sphere(johnCartoonHead,.023,skin,0,-.021,.19);johnNose.scale.set(.9,.9,1.15);
      const johnMouth=box(johnCartoonHead,.047,.005,.008,M('#754838'),0,-.077,.167,.002);
      // Capuz continuo com abertura frontal; a superficie nao cruza o rosto.
      hairCap.visible=true;
      const hoodMaterial=M('#080808',.02,.96),hoodLining=M('#151515',.02,1);
      hoodMaterial.side=THREE.DoubleSide;
      const hoodGeometry=new THREE.SphereGeometry(.245,32,22,0,Math.PI*2,1.02,Math.PI-1.02);
      hoodGeometry.rotateX(Math.PI/2);
      const hood=new THREE.Mesh(hoodGeometry,hoodMaterial);hood.position.set(0,.015,-.015);hood.scale.set(.98,1.16,1);hood.castShadow=true;johnCartoonHead.add(hood);
      const openingRadius=.245*Math.sin(1.02),openingZ=.245*Math.cos(1.02)-.015;
      const rim=[];
      for(let i=0;i<64;i++){const angle=i/64*Math.PI*2;rim.push(new THREE.Vector3(Math.cos(angle)*openingRadius*.98,.015+Math.sin(angle)*openingRadius*1.16,openingZ));}
      const hoodEdge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim,true),64,.011,6,true),hoodLining);johnCartoonHead.add(hoodEdge);
      // Franja curta visivel entre o capuz e a testa.
      for(let i=0;i<3;i++) {
        const fringe=sphere(johnCartoonHead,.054,naturalHair,-.055+i*.045,.165-i*.012,.128);
        fringe.scale.set(.9,.48,.7);fringe.rotation.z=-.25;
      }
      for(const side of [-1,1]) {
        const cord=box(avatar,.01,.19,.01,M('#b9c2c7'),side*.075,1.18,.155,.003);cord.rotation.z=side*.05;
        box(avatar,.013,.024,.013,metal,side*.08,1.075,.155,.003);
      }
      box(avatar,.27,.1,.035,shirtLight,0,.9,.177,.025);
      johnCartoonHead.scale.setScalar(1.48);
      avatar.position.set(-1.2, 0, 2.45);
      // NPCs independentes do personagem controlado pelo jogador.
      const npcs = [];
      function createNpc(name, skinColor, outfitColor, x, z, style, hairStyle=style) {
        const root = new THREE.Group();
        root.position.set(x, 0, z);
        root.rotation.y = -.35;
        scene.add(root);
        const skinMat = M(skinColor), outfit = M('#080808'), trousers = M(style === 'curly' ? '#242a35' : '#141b25');
        const darkHair = M('#241910'), boots = M('#16191b');
        skinMat.roughness=.72;outfit.roughness=.94;trousers.roughness=.95;
        const bodyProfile=[new THREE.Vector2(.145,0),new THREE.Vector2(.155,.04),new THREE.Vector2(.16,.18),new THREE.Vector2(.185,.34),new THREE.Vector2(.175,.4),new THREE.Vector2(.09,.47)];
        const torso=new THREE.Mesh(new THREE.LatheGeometry(bodyProfile,20),outfit);torso.position.y=.8;torso.scale.z=.69;torso.castShadow=true;root.add(torso);
        const isSuit=false;
        function softLimb(parent,width,length,depth,material,x,y,z) {
          const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(1,6,4,10),material);
          mesh.scale.set(width/2,length/8,depth/2);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
        }
        addBlackLabCoat(root);
        const npcArms = [], npcLegs = [], npcKnees = [], npcElbows = [], eyes = [];
        if(style==='curly') {
          const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.175,.235,.27,24,1,false),M('#252c37',.02,.92));
          skirt.position.set(0,.705,0);skirt.scale.z=.75;skirt.castShadow=true;root.add(skirt);
          const waistband=new THREE.Mesh(new THREE.CylinderGeometry(.177,.177,.035,24),outfit);waistband.position.y=.835;waistband.scale.z=.75;root.add(waistband);
        } else softLimb(root,.33,.19,.23,trousers,0,.75,0);
        cyl(root, .065, .1, skinMat, 0, 1.32, 0);
        const head = new THREE.Group();
        head.position.y = 1.59; head.scale.setScalar(1.4);
        root.add(head);
        const face=sphere(head,.18,skinMat,0,0,.015);face.scale.set(.95,1.02,.94);
        const jaw=sphere(head,.125,skinMat,0,-.085,.045);jaw.scale.set(1.05,.77,.94);
        for (const side of [-1, 1]) {
          sphere(head, .037, skinMat, side * .176, 0, .01);
          const eye=new THREE.Group();eye.position.set(side*.066,.026,.174);head.add(eye);eyes.push(eye);
          const eyeWhite=sphere(eye,.036,M('#f5f1e9',0,.3),0,0,0);eyeWhite.scale.set(.87,1.14,.5);
          const iris=sphere(eye,.025,M(style==='curly'?'#79643f':'#59422d',0,.3),0,0,.016);iris.scale.z=.35;
          const pupil=sphere(eye,.016,eyeMat,0,0,.023);pupil.scale.set(.83,1.2,.35);sphere(eye,.007,white,-.008,.013,.029);sphere(eye,.003,white,.008,-.009,.029);
          const lid=new THREE.CatmullRomCurve3([new THREE.Vector3(-.032,.004,0),new THREE.Vector3(0,.044,.006),new THREE.Vector3(.032,.004,0)]);
          eye.add(new THREE.Mesh(new THREE.TubeGeometry(lid,8,.0025,4,false),darkHair));
          const earInner=sphere(head,.022,M(skinColor).clone(),side*.178,-.004,.026);earInner.scale.set(.45,.85,.45);earInner.material.color.multiplyScalar(.82);
          const brow=box(head,.055,.014,.015,darkHair,side*.066,.089,.17,.006);brow.rotation.z=side*-.08;
          const leg = new THREE.Group(); leg.position.set(side * .105, .735, 0); root.add(leg); npcLegs.push(leg);
          softLimb(leg,.14,.33,.155,style==='curly'?skinMat:trousers,0,-.15,0);
          const knee = new THREE.Group(); knee.position.y = -.3; leg.add(knee); npcKnees.push(knee);
          softLimb(knee,.137,.35,.15,style==='curly'?skinMat:trousers,0,-.16,0);
          if(style==='curly') {
            softLimb(knee,.15,.28,.16,boots,0,-.205,0);
            cyl(knee,.078,.025,boots,0,-.08,0);
            for(let lace=0;lace<5;lace++)box(knee,.06,.006,.009,metal,0,-.12-lace*.035,.081,.001);
            box(knee,.15,.03,.27,boots,0,-.408,.055,.007);
          }
          const shoe=sphere(knee,.1,boots,0,-.36,.055);shoe.scale.set(.92,.7,1.55);box(knee,.175,.025,.29,boots,0,-.417,.055,.008);
          const arm = new THREE.Group();
          arm.position.set(side * .184, 1.2, 0);
          arm.rotation.z = side * .08;
          root.add(arm); npcArms.push(arm);
          softLimb(arm,.13,.25,.145,outfit,0,-.1,0);
          const elbow=new THREE.Group();elbow.position.y=-.22;arm.add(elbow);npcElbows.push(elbow);
          sphere(arm,.065,outfit,0,0,0);
          sphere(elbow,.052,outfit,0,0,0);
          softLimb(elbow,.102,.27,.115,outfit,0,-.125,0);
          const hand=sphere(elbow,.048,skinMat,0,-.27,0);hand.scale.set(.78,1,.6);
          sphere(elbow,.022,skinMat,-side*.032,-.26,.02);
          for(let finger=0;finger<4;finger++)softLimb(elbow,.012,.036,.014,skinMat,-.02+finger*.014,-.306,.008);
          const cuff=new THREE.Mesh(new THREE.TorusGeometry(.052,.005,5,14),outfit);cuff.rotation.x=Math.PI/2;cuff.position.y=-.23;elbow.add(cuff);
        }
        const nose=sphere(head,.023,skinMat,0,-.012,.182);nose.scale.set(.9,.9,1.15);
        const lipColor=M(skinColor);lipColor.color.multiply(new THREE.Color('#a76a6b'));
        const lips=sphere(head,.027,lipColor,0,-.074,.17);lips.scale.set(1,.16,.19);
        const lowerLip=sphere(head,.021,skinMat,0,-.082,.17);lowerLip.scale.set(1,.18,.22);
        if(hairStyle==='straight') {
          const cap=new THREE.Mesh(new THREE.SphereGeometry(.19,28,20,0,Math.PI*2,0,1.48),darkHair);
          cap.position.set(0,.025,-.012);head.add(cap);
          const back=sphere(head,.18,darkHair,0,-.035,-.11);back.scale.set(1.05,1.45,.46);
          for(const side of [-1,1]){
            const lock=sphere(head,.075,darkHair,side*.165,-.055,-.01);lock.scale.set(.40,2.65,.85);
          }
          const fringe=sphere(head,.13,darkHair,-.025,.13,.09);fringe.scale.set(1.12,.32,.58);fringe.rotation.z=-.12;
        } else if (style === 'curly') {
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
          const cap=new THREE.Mesh(new THREE.SphereGeometry(.185,24,16,0,Math.PI*2,0,1.35),darkHair);cap.position.set(0,.018,-.015);head.add(cap);
          if(style==='casual') {
            for(let lock=0;lock<4;lock++) {
              const quiff=sphere(head,.077,darkHair,-.085+lock*.048,.158+Math.sin(lock*.7)*.035,.04);
              quiff.scale.set(1.1,.66,.9);quiff.rotation.z=-.3;
            }
          }
          // Deixa a testa e o rosto descobertos.
          
          if (style === 'military') {
            const beardMat=M('#33251e',.02,.96);
            // Barba contornando o maxilar e bigode, preservando a boca.
            for(const side of [-1,1]) {
              const cheek=sphere(head,.047,beardMat,side*.112,-.065,.12);cheek.scale.set(.55,1.15,.48);
              const jawBeard=sphere(head,.052,beardMat,side*.067,-.115,.127);jawBeard.scale.set(1.05,.7,.45);
              const moustache=sphere(head,.031,beardMat,side*.026,-.051,.178);moustache.scale.set(1.05,.28,.25);
            }
            const chinBeard=sphere(head,.058,beardMat,0,-.126,.14);chinBeard.scale.set(1,.58,.4);


          }
        }
        npcs.push({ name, root, head, arms: npcArms, forearms: npcElbows, legs: npcLegs, knees: npcKnees, eyes, torso, nextBlink: 2 + Math.random()*4, blinkTime: 0, taskIndex: npcs.length, wait: 1 + npcs.length, path: [], phase: 0 });
        return root;
      }
      createNpc('Vitória', '#efd0b9', '#984b78', .7, 1.55, 'curly');
      createNpc('Xandy', '#643b28', '#315d8a', 2.05, .25, 'casual');
      createNpc('Alex', '#e7c3a9', '#626d43', 2.2, 2.25, 'military');
      createNpc('Snot', '#a36c46', '#344954', -.5, 1.5, 'technician');
      npcs.slice(0,3).forEach(npc=>npc.role='programming');
      const solderNpc=npcs[npcs.length-1];
      solderNpc.role='soldering';
      createNpc('Luiza', '#c49272', '#080808', -2.35, 2.28, 'curly', 'straight');
      const analystNpc=npcs[npcs.length-1];analystNpc.role='analyst';
      analystNpc.task={id:'mesaLeitura',action:'analyze'};
      const analysisTarget=new THREE.Group();analysisTarget.position.set(0,.89,.30);readingDesk.add(analysisTarget);
      const analysisPage=new THREE.Group();analysisPage.position.set(.20,.984,.10);readingDesk.add(analysisPage);
      box(analysisPage,.19,.004,.27,bookPaper,0,0,0,.002);
      for(let line=0;line<6;line++)box(analysisPage,.14,.001,.003,M('#667681'),0,.003,-.09+line*.026);

      // O alvo acompanha a bancada mesmo depois de mover ou girar o móvel.
      const solderTarget=new THREE.Group();
      solderTarget.position.set(-.12,1.015,-.27);
      solderTarget.rotation.y=Math.PI;
      byId.mesaL.g.add(solderTarget);
      const solderStation={userData:{keyboard:solderTarget}};
      const solderChair=new THREE.Group();byId.mesaL.g.add(solderChair);
      solderChair.position.set(-.18,0,.84);solderChair.rotation.y=Math.PI;
      const chairCloth=M('#182129'),chairSteel=M('#52616a',.7,.35);
      box(solderChair,.43,.10,.42,chairCloth,0,.59,0,.04);
      box(solderChair,.43,.42,.075,chairCloth,0,.88,-.19,.035);
      cyl(solderChair,.035,.49,chairSteel,0,.28,0);
      for(let spoke=0;spoke<5;spoke++){
        const leg=new THREE.Group();leg.rotation.y=spoke*Math.PI*2/5;solderChair.add(leg);
        box(leg,.045,.035,.29,chairSteel,0,.075,.12,.008);
        sphere(leg,.045,chairCloth,0,.05,.25);
      }

      const solderTool=new THREE.Group();
      cyl(solderTool,.018,.085,M('#202a32'),0,-.29,0);
      cyl(solderTool,.006,.075,M('#b5bac1'),0,-.37,0);
      solderNpc.forearms[1].add(solderTool);solderTool.visible=false;
      const assemblyTool=new THREE.Group();
      cyl(assemblyTool,.018,.065,M('#285e91'),0,-.29,0);
      cyl(assemblyTool,.004,.07,M('#b5bac1'),0,-.355,0);
      solderNpc.forearms[1].add(assemblyTool);assemblyTool.visible=false;
      const assemblyPc=new THREE.Group();byId.mesaL.g.add(assemblyPc);assemblyPc.visible=false;
      // Gabinete aberto deitado: placa-mãe, memória, ventoinha e fonte visíveis.
      const assemblyChassis=M('#252b32',.6,.45),assemblyPcb=M('#235f48'),assemblyComponents=M('#101820');
      box(assemblyPc,.36,.025,.25,assemblyChassis,0,1.083,0,.008);
      for(const side of [-1,1])box(assemblyPc,.015,.09,.25,assemblyChassis,side*.18,1.12,0);
      box(assemblyPc,.29,.012,.20,assemblyPcb,0,1.105,0);
      box(assemblyPc,.065,.026,.065,M('#adb4bd',.7,.3),-.04,1.125,0);
      for(const x of [.035,.065])box(assemblyPc,.012,.04,.13,assemblyComponents,x,1.13,0);
      box(assemblyPc,.075,.07,.09,assemblyChassis,.13,1.14,.055);
      const assemblyFan=cyl(assemblyPc,.036,.022,assemblyComponents,-.10,1.13,-.065);
      for(let blade=0;blade<4;blade++){
        const fin=box(assemblyPc,.046,.009,.012,M('#626c79'),-.10,1.145,-.065);fin.rotation.y=blade*Math.PI/2;
      }

      const assemblyRam=box(assemblyPc,.012,.045,.12,M('#367657'),.035,1.13,0);
      const assemblyDrive=box(assemblyPc,.07,.018,.10,M('#7792a8',.6,.4),.09,1.13,-.055);
      const assemblyTestLed=sphere(assemblyPc,.009,glow('#26343b'),.16,1.18,.085);
      const partsTray=new THREE.Group();byId.mesaL.g.add(partsTray);
      box(partsTray,.23,.02,.19,M('#404a53'),.74,1.09,.60,.008);
      for(let screw=0;screw<6;screw++)cyl(partsTray,.007,.015,M('#a6afb7',.8,.25),.67+(screw%3)*.035,1.11,.55+Math.floor(screw/3)*.04);
      const solderBoard=new THREE.Group();byId.mesaL.g.add(solderBoard);
      // Uma segunda placa na borda acessível da bancada.
      box(solderBoard,.32,.012,.19,M('#236c4a'),-.12,1.085,-.25);
      for(let chip=0;chip<3;chip++)box(solderBoard,.045,.018,.055,M('#18232c'),-.21+chip*.09,1.1,-.25);


      let edit = false, selected = null, dragging = false, camDrag = false, oldX = 0, oldY = 0, pitch = .74, yaw = Math.PI / 4, zoom = 1, near = null; const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3(), offset = new THREE.Vector3(); const keys = new Set();       const list = document.getElementById('list'), selText = document.getElementById('selected'), addPicture = document.getElementById('addPicture'), pictureFile = document.getElementById('pictureFile'), pictureStatus = document.getElementById('pictureStatus'); for (const o of objects) { const b = document.createElement('button'); b.textContent = o.label; b.onclick = () => select(o); list.append(b); o.button = b }
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
        if(action==='mouse')interactionAudio.play('mouse');
        if (!savedAvatarPosition) {
          savedAvatarPosition = avatar.position.clone();
          savedAvatarRotation = avatar.rotation.y;
        }
        interactionPose = action;
        interactionTime = 0;
        const chair = byId.cadeira.g.position;
        const chairRotation = byId.cadeira.g.rotation.y;
        const seatOffset = new THREE.Vector3(0, -.1, .34).applyAxisAngle(new THREE.Vector3(0, 1, 0), chairRotation);
        avatar.position.set(chair.x + seatOffset.x, seatOffset.y, chair.z + seatOffset.z);
        avatar.rotation.y = chairRotation;
        if(action==='typing') {
          const keyboard=byId.teclado.g;
          const typingPosition=keyboard.localToWorld(new THREE.Vector3(0,0,.53));
          avatar.position.set(typingPosition.x,-.1,typingPosition.z);
          const keyboardRotation=new THREE.Quaternion();keyboard.getWorldQuaternion(keyboardRotation);
          const facing=new THREE.Vector3(0,0,-1).applyQuaternion(keyboardRotation);
          avatar.rotation.y=Math.atan2(facing.x,facing.z);
        }
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
      function select(o) { if (o && !edit) document.getElementById('edit').click(); selected = o; syncRotationInputs(); objects.forEach(a => a.button.classList.toggle('active', a === o)); selText.textContent = o ? 'Selecionado: ' + o.label : 'Nenhum objeto selecionado'; addPicture.disabled = !o || !pictureFrames[o.id]; if (o && pictureFrames[o.id]) { document.getElementById('mediaTools').open = true; document.getElementById('pictureSection').open = true } pictureStatus.textContent = o && pictureFrames[o.id] ? (pictureImages[o.id] ? 'Imagem personalizada neste quadro.' : 'Escolha uma imagem do seu dispositivo.') : 'Selecione um quadro para adicionar uma imagem.' }
      function setPictureTexture(id, texture) {
        const image = pictureFrames[id];
        if (!image) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        texture.needsUpdate = true;
        image.material.map?.dispose();
        image.material.map = texture;
        image.material.needsUpdate = true;
        image.visible = true;
      }
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
          const crop = pictureCrop(bitmap);
          const canvas = document.createElement('canvas');
          canvas.width = crop.width;
          canvas.height = crop.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Não foi possível preparar a imagem.');
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(bitmap, crop.x, crop.y, crop.cropWidth, crop.cropHeight, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg', .92), texture = new THREE.CanvasTexture(canvas);
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
      const cameraCenter=new THREE.Vector3(2.5,1.05,2.4),cameraGoal=cameraCenter.clone();
      let viewYaw=yaw,viewPitch=pitch,viewZoom=zoom,panDrag=false,touchCenter=null;
      function panCamera(dx,dy) {
        const scale=(innerWidth<700?24:20)/viewZoom/innerHeight;
        cameraGoal.x-=Math.cos(viewYaw)*dx*scale;
        cameraGoal.z+=Math.sin(viewYaw)*dx*scale;
        cameraGoal.x-=Math.sin(viewYaw)*dy*scale/Math.max(.3,Math.sin(viewPitch));
        cameraGoal.z-=Math.cos(viewYaw)*dy*scale/Math.max(.3,Math.sin(viewPitch));
        cameraGoal.x=THREE.MathUtils.clamp(cameraGoal.x,-8,14);cameraGoal.z=THREE.MathUtils.clamp(cameraGoal.z,-8,14);
      }
      function cameraUpdate() { const aspect = innerWidth / innerHeight, size = innerWidth < 700 ? 12 : 10; camera.left = -size * aspect / viewZoom; camera.right = size * aspect / zoom; camera.top = size / viewZoom; camera.bottom = -size / zoom; camera.position.set(cameraCenter.x+Math.sin(viewYaw)*16*Math.cos(viewPitch),cameraCenter.y+16*Math.sin(viewPitch),cameraCenter.z+Math.cos(viewYaw)*16*Math.cos(viewPitch));camera.lookAt(cameraCenter); camera.updateProjectionMatrix();
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
      const ROOM = { minX: -4.42, maxX: 9.42, minZ: -3.42, maxZ: 8.42 };
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
      function wallPenetration(o) {
        if(o.kind.startsWith('wall'))return 0;
        const bounds=footprint(o);let penetration=0;
        for(const wallMesh of apartmentWalls) {
          wallMesh.updateWorldMatrix(true,false);
          const obstacle=new THREE.Box3().setFromObject(wallMesh);
          const x=Math.min(bounds.max.x,obstacle.max.x)-Math.max(bounds.min.x,obstacle.min.x);
          const y=Math.min(bounds.max.y,obstacle.max.y)-Math.max(bounds.min.y,obstacle.min.y);
          const z=Math.min(bounds.max.z,obstacle.max.z)-Math.max(bounds.min.z,obstacle.min.z);
          if(x>.005 && y>.005 && z>.005)penetration+=x*y*z;
        }
        return penetration;
      }
      function moveSafe(o, position, rotation = o.g.rotation.y) {
        const start=o.g.position.clone(),startRotation=o.g.rotation.y;
        const overlapAtStart=overlapsSolid(o);
        let changed=false;
        const steps=Math.max(1,Math.ceil(start.distanceTo(position)/.05),Math.ceil(Math.abs(rotation-startRotation)/(Math.PI/90)));
        const target=position.clone();
        for(let i=1;i<=steps;i++) {
          const oldPosition=o.g.position.clone(),oldRotation=o.g.rotation.y;
          o.g.position.lerpVectors(start,target,i/steps);o.g.rotation.y=startRotation+(rotation-startRotation)*i/steps;
          const valid=fitsRoom(o) && (overlapAtStart || !overlapsSolid(o));
          if(!valid){o.g.position.copy(oldPosition);o.g.rotation.y=oldRotation;o.g.updateWorldMatrix(true,true);break;}
          changed=true;
        }
        if (changed && wallPenetration(o) > .000001) {
          o.g.position.copy(start);
          o.g.rotation.y=startRotation;
          o.g.updateWorldMatrix(true,true);
          return false;
        }
        return changed;
      }
      let roomColliders = null, colliderLayout = '';
      function refreshRoomColliders() {
        const layout = objects.map(o => [o.g.position.x, o.g.position.y, o.g.position.z, o.g.rotation.y, o.g.scale.x, o.g.scale.y, o.g.scale.z].join(',')).join(';');
        if (roomColliders && layout === colliderLayout) return;
        colliderLayout = layout;
        roomColliders = objects.flatMap(o => {
          if(o.id.startsWith('setup')){
            o.g.updateWorldMatrix(true,true);
            return o.g.children.filter(child=>child.userData.stationPiece)
              .map(child=>new THREE.Box3().setFromObject(child));
          }
          if(o.id!=='mesaL')return [footprint(o)];
          // Duas partes da mesa em L: preserva o espaço livre para a cadeira.
          o.g.updateWorldMatrix(true,false);
          return [new THREE.Box3(new THREE.Vector3(-1.1,0,-.36),new THREE.Vector3(1.1,1.07,.36)),
            new THREE.Box3(new THREE.Vector3(.38,0,.36),new THREE.Vector3(1.1,1.07,1.64))]
            .map(bounds=>bounds.applyMatrix4(o.g.matrixWorld));
        }).filter(b => b.min.y < 1.95 && b.max.y > .08).concat(apartmentWalls.map(mesh => new THREE.Box3().setFromObject(mesh)).filter(b => b.min.y < 1.95));
      }
      function roomBlocked(x, z, radius = .23) {
        if (x < ROOM.minX + radius || x > ROOM.maxX - radius || z < ROOM.minZ + radius || z > ROOM.maxZ - radius) return true;
        if (!roomColliders) refreshRoomColliders();
        for (const b of roomColliders) {
          const cx = Math.max(b.min.x, Math.min(x, b.max.x));
          const cz = Math.max(b.min.z, Math.min(z, b.max.z));
          if ((x - cx) ** 2 + (z - cz) ** 2 < radius ** 2) return true;
        }
        return false;
      }
      function avatarBlocked(x, z) {
        return roomBlocked(x, z) || npcs.some(npc => Math.hypot(x - npc.root.position.x, z - npc.root.position.z) < .46);
      }
      const npcTasks = [
        { id: 'bibliotecaNova', action: 'books' },
        { id: 'pecasTI', action: 'inspect' },
        { id: 'mesaLeitura', action: 'books' },
        { id: 'mesa', action: 'work' },
        { id: 'mesaL', action: 'work' },
        { id: 'bancadaTI', action: 'work' },
        { id: 'instrumentosTI', action: 'inspect' },
        { id: 'rackExtraTI', action: 'inspect' }
      ];
      // Busca no piso livre: escolhe o ponto acessivel mais perto do movel da tarefa.
      const NPC_RADIUS = .36;
      function npcSegmentClear(ax, az, bx, bz) {
        const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / .05));
        for (let i = 0; i <= steps; i++) if (roomBlocked(ax + (bx - ax) * i / steps, az + (bz - az) * i / steps, NPC_RADIUS)) return false;
        return true;
      }
      function recoverNpc(npc, dt) {
        const pos = npc.root.position;
        if (!roomBlocked(pos.x, pos.z, NPC_RADIUS)) return true;
        npc.path = []; npc.task = null;
        npc.recoveryWait = (npc.recoveryWait || 0) - dt;
        if (npc.recoveryWait > 0) return false;
        npc.recoveryWait = 1;
        for (let radius = .15; radius < 9; radius += .15) {
          for (let i = 0; i < 24; i++) {
            const angle = i * Math.PI / 12, x = pos.x + Math.cos(angle) * radius, z = pos.z + Math.sin(angle) * radius;
            if (!roomBlocked(x, z, NPC_RADIUS) && !npcs.some(other => other !== npc && Math.hypot(x - other.root.position.x, z - other.root.position.z) < NPC_RADIUS * 2) && Math.hypot(x - avatar.position.x, z - avatar.position.z) > .6) {
              pos.set(x, 0, z); npc.wait = 1; return true;
            }
          }
        }
        return false;
      }
      function solderWorkPosition() {
        const bench=byId.mesaL.g;
        bench.updateWorldMatrix(true,true);
        const candidates=[{x:-.18,z:.84,tx:-.18,tz:.30,angle:Math.PI},{x:-.12,z:-.82,tx:-.12,tz:-.27,angle:0},
          {x:-1.55,z:.02,tx:-1,tz:.02,angle:Math.PI/2},
          {x:1.54,z:1.1,tx:1.04,tz:1.1,angle:-Math.PI/2},
          {x:.74,z:2.09,tx:.74,tz:1.59,angle:Math.PI}];
        for(const candidate of candidates){
          const position=bench.localToWorld(new THREE.Vector3(candidate.x,0,candidate.z));
          if(roomBlocked(position.x,position.z,NPC_RADIUS))continue;
          const from=position.clone().setY(1.15);
          const to=bench.localToWorld(new THREE.Vector3(candidate.tx,1.1,candidate.tz));
          const direction=to.clone().sub(from),distance=direction.length();
          const testRay=new THREE.Ray(from,direction.normalize());
          if(apartmentWalls.some(mesh=>{
            const hit=testRay.intersectBox(new THREE.Box3().setFromObject(mesh),new THREE.Vector3());
            return hit&&hit.distanceTo(from)<distance;
          }))continue;
          return {...candidate,position};
        }
        return null;
      }
      function planNpcTask(npc) {
        const personalId = ['setupVitoria','setupXandy','setupAlex'][npcs.indexOf(npc)];
        const choices = npcTasks.filter(task => task.id !== npc.task?.id && !npcs.some(other => other !== npc && other.task?.id === task.id));
        const task = npc.role==='programming' ? {id:personalId,action:'work'} : npc.role==='soldering' ? {id:'mesaL',action:'solder'} : personalId && Math.random() < .55 && npc.task?.id !== personalId ? {id:personalId,action:'work'} : choices[Math.floor(Math.random() * choices.length)] || npcTasks[0];
        npc.taskIndex++;
        npc.task = task;
        const destination = task.action==='solder' ? (solderWorkPosition()?.position || npc.root.position.clone()) : task.id.startsWith('setup') ? byId[task.id].g.localToWorld(new THREE.Vector3(-.15,0,2.05)) : byId[task.id].g.position;
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
            if (!npcSegmentClear(node.x, node.z, x, z)) continue;
            queue.push({ x, z, gx, gz, parent: i });
          }
        }
        npc.path = [];
        for (let i = best; queue[i].parent !== -1; i = queue[i].parent) npc.path.unshift(queue[i]);
        // A grade de navegação pode terminar até 21 cm antes do alvo.
        // Completa o ?ltimo trecho até a posição exata, mantendo a colisão.
        if(task.action==='solder' && npcSegmentClear(queue[best].x,queue[best].z,destination.x,destination.z)) {
          npc.path.push({x:destination.x,z:destination.z});
        }

      }
      // Conversas em bolhas HTML: acompanham os personagens sem depender da textura 3D.
      const npcChatLayer = document.createElement('div');
      npcChatLayer.id = 'npcChatLayer'; document.body.append(npcChatLayer);
      const npcChats = [
        ['Alguem conferiu o backup hoje?', 'Conferi! Os arquivos estao seguros.', 'Boa. Vou checar o servidor tambem.'],
        ['Essa placa ainda tem conserto.', 'Quer ajuda com a solda?', 'Eu separo as ferramentas.'],
        ['A rede esta mais rapida hoje!', 'Os cabos azuis fizeram sucesso.', 'Agora falta organizar as pontas.'],
        ['Bora colocar uma musica?', 'Rock combina com esse laboratorio!', 'Pode tocar, mas sem cobrir os alertas.'],
        ['Achei um projeto legal na estante.', 'Da para montar aqui na bancada?', 'Vamos planejar antes de ligar tudo.'],
        ['Quem deixou essa chave aqui?', 'Fui eu! Ja vou guardar.', 'Uma ferramenta no lugar certo ajuda muito.'],
        ['Esse setup ficou bonito demais.', 'A camisa GuedesSEC completou o visual.', 'Equipe pronta para a proxima missao!'],
        ['Hora de uma pausa para cafe?', 'So vou terminar este teste.', 'Combinado. Eu espero voces.'],
        ['Tem uma luz piscando no rack.', 'Vou conferir os registros.', 'Eu acompanho a conexao daqui.'],
        ['Precisamos anotar essa ideia.', 'A lousa tem espaco!', 'Vou montar uma lista de tarefas.'],
        ['O Wi-Fi esta chegando em todo canto?', 'Aqui o sinal esta otimo.', 'Entao podemos testar o proximo projeto.'],
        ['A bancada em L ficou bem pratica.', 'Agora da para separar as pecas.', 'E deixar as ferramentas organizadas.']
      ];
      npcChats.push(...guedesConversations);
      const npcChatBubbles = npcs.map(npc => {
        const element = document.createElement('div'); element.className = 'npcChatBubble'; element.hidden = true;
        npcChatLayer.append(element); return { npc, element, remaining: 0 };
      });
      npcChats.push(
        ['Vamos criar um painel para os servidores?', 'Eu posso montar a API e organizar os dados.', 'E eu preparo os testes e a revisao de acesso.'],
        ['O projeto precisa funcionar no celular tambem.', 'Entao vamos testar os botoes com toque e teclado.', 'Boa. Vamos incluir isso nos criterios de entrega.'],
        ['Antes de publicar, quero revisar o formulario.', 'Eu verifico a validacao e as mensagens de erro.', 'Depois testamos com dados validos e invalidos.'],
        ['Como vamos proteger o acesso ao painel?', 'O servidor precisa validar cada permissao.', 'E sem guardar senhas ou segredos no codigo do navegador.'],
        ['A consulta esta ficando lenta com muitos registros.', 'Podemos medir o tempo e adicionar paginacao.', 'Vamos comparar o resultado antes e depois da mudanca.'],
        ['Quero automatizar os backups deste projeto.', 'Precisamos definir quais arquivos e bancos entram.', 'E testar a restauracao, nao apenas criar a copia.'],
        ['Vamos separar uma tarefa pequena para hoje?', 'Que tal entregar a lista de dispositivos primeiro?', 'Combinado. Depois adicionamos filtros e detalhes.'],
        ['Encontrei um erro na integracao entre as telas.', 'Vamos reproduzir com um exemplo pequeno.', 'Depois escrevemos um teste para evitar que volte.']
      );
      const npcVoices=createNpcVoices(index=>{
        const npc=npcs[index];if(!npc)return 0;
        const distance=Math.hypot(npc.root.position.x-avatar.position.x,npc.root.position.z-avatar.position.z);
        const fraction=THREE.MathUtils.clamp((distance-1.5)/10.5,0,1);
        return (1-fraction)*(1-fraction);
      });
      let talkingNpc = null;
      const conversation = document.createElement('section'); conversation.id = 'npcConversation'; conversation.hidden = true;
      conversation.setAttribute('aria-label', 'Conversa com personagem');
      conversation.innerHTML = '<header><div class="npcChatIdentity"><span class="npcChatAvatar" aria-hidden="true">NPC</span><div><span class="npcChatEyebrow">CONVERSA</span><strong id="npcConversationName"></strong></div></div><button type="button" id="npcConversationClose" aria-label="Fechar conversa">&#10005;</button></header><div id="npcConversationLog" role="log" aria-live="polite" aria-label="Historico da conversa"></div><details class="npcChatSuggestions"><summary>Sugestoes de assunto</summary><div id="npcTopics"><button type="button">O que acha do GuedesSEC?</button><button type="button">Como foi seu dia?</button><button type="button">O que esta fazendo?</button><button type="button">Me ajude com um projeto</button><button type="button">Tem alguma duvida para mim?</button><button type="button">Como organizar uma API?</button><button type="button">Como esta a rede?</button></div></details><form id="npcConversationForm"><input id="npcMessage" maxlength="300" placeholder="Escreva sua mensagem..." aria-label="Sua mensagem" autocomplete="off" required><button aria-label="Enviar mensagem">&#8593;</button></form><small class="npcChatDisclaimer">Personagem virtual / respostas locais</small>';

      document.body.append(conversation);
      const log = document.getElementById('npcConversationLog');
      function addChatLine(who, text) {
        const line = document.createElement('p');line.className=who==='Voce'?'npcMessageUser':'npcMessageReply'; const author = document.createElement('strong');
        author.textContent = who + ': '; line.append(author, document.createTextNode(text)); log.append(line);while(log.children.length>80)log.firstChild.remove(); log.scrollTop = log.scrollHeight;
      }
      function npcSay(npc, text) {
        text=naturalNpcText(text);
        const bubble = npcChatBubbles.find(b => b.npc === npc);
        bubble.element.textContent = npc.name + ': ' + text; bubble.remaining = 9;
        addChatLine(npc.name, text);
        bubble.remaining=Math.max(9,Math.min(35,text.length/13));
        npcVoices.speak(text,npcs.indexOf(npc),true);
      }
      function openNpcConversation(npc) {
        talkingNpc = npc; keys.clear(); walkTarget = null;
        npc.path = []; npc.wait = 3;
        npc.legs.forEach(leg => leg.rotation.x = 0); npc.arms.forEach(arm => arm.rotation.x = 0);
        npc.root.rotation.y = Math.atan2(avatar.position.x - npc.root.position.x, avatar.position.z - npc.root.position.z);
        conversation.hidden = false; log.replaceChildren();
        document.getElementById('npcConversationName').textContent = npc.name;
        conversation.querySelector('.npcChatAvatar').textContent=npc.name.slice(0,1);conversation.querySelector('.npcChatSuggestions').open=false;
        npcSay(npc, ['Oi! Vamos pensar em um projeto para o lab?', 'E ai! Precisa de ajuda com alguma coisa?', 'Ola! Qual e a missao de hoje?', 'Oi! Estou soldando uma placa. Quer conversar sobre eletrônica ou algum projeto?'][npcs.indexOf(npc)]);
        document.getElementById('npcMessage').focus();
      }
      function answerNpc(message) {
        if (!talkingNpc) return;
        const npc = talkingNpc;
        addChatLine('Voce', message);
        const taskLabel = npc.task?.id ? byId[npc.task.id]?.label : null;
        if(npc.role==='analyst'){
          const topic=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
          const responses=/cliente|atendimento/.test(topic)?['Estou revisando os chamados dos clientes para identificar problemas recorrentes. Podemos agrupar por impacto e urg?ncia. Qual caso voc? quer analisar?']:
            /seguranca|risco|backup/.test(topic)?['Estou avaliando riscos dos projetos: permiss?es, prote??o de dados e restaura??o dos backups. Precisamos confirmar cada ponto com testes. Qual sistema voc? quer revisar?']:
            /projeto|prioridade|empresa|guedes/.test(topic)?['Minha proposta ? comparar impacto para os clientes, esfor?o e riscos antes de definir as prioridades do GuedesSEC. Qual entrega est? em discuss?o?', 'Estou organizando requisitos e crit?rios de aceite. Assim conseguimos verificar se cada entrega resolve o problema combinado com o cliente.']:
            ['Estou lendo documentos e analisando melhorias para a empresa. Hoje meu foco ? planejamento, qualidade e necessidades dos clientes. Sobre qual assunto vamos conversar?', 'Podemos analisar isso juntas com a equipe. Me conte o contexto, o objetivo e a principal d?vida para organizarmos os pr?ximos passos.'];
          npc.analysisReply=(npc.analysisReply||0)+1;npcSay(npc,responses[(npc.analysisReply-1)%responses.length]);
        }else npcSay(npc, replyToNpc(npc, message, npcs.indexOf(npc), taskLabel));
      }
      document.getElementById('npcConversationClose').onclick = () => { conversation.hidden = true; npcVoices.stop(); if(talkingNpc) talkingNpc.wait = 2; talkingNpc = null; renderer.domElement.focus(); };
      document.getElementById('npcConversationForm').onsubmit = e => { e.preventDefault(); const input = document.getElementById('npcMessage'); if(input.value.trim()) answerNpc(input.value.trim()); input.value = ''; };
      document.querySelectorAll('#npcTopics button').forEach(button => button.onclick = () => {answerNpc(button.textContent);conversation.querySelector('.npcChatSuggestions').open=false;document.getElementById('npcMessage').focus();});
      const recentNpcConversations=[];
      let chatWait = 0, chatIndex = -1, chatTurn = 0, chatLead = 0;
      const chatPoint = new THREE.Vector3();
      function updateNpcChats(dt) {
        if(!talkingNpc&&!npcVoices.speaking)chatWait -= dt;
        if (chatWait <= 0 && npcs.length && !talkingNpc && !npcVoices.speaking) {
          if (chatTurn === 0) {
            const candidates=npcChats.map((_,i)=>i).filter(i=>!recentNpcConversations.includes(i));
            chatIndex=candidates[Math.floor(Math.random()*candidates.length)];
            recentNpcConversations.push(chatIndex);if(recentNpcConversations.length>Math.min(10,npcChats.length-1))recentNpcConversations.shift();
            chatLead = Math.floor(Math.random() * npcs.length);
          }
          const bubble = npcChatBubbles[(chatLead + chatTurn) % npcs.length];
          if (bubble.npc !== talkingNpc) {const text=naturalNpcText(npcChats[chatIndex][chatTurn]);bubble.element.textContent=bubble.npc.name+': '+text;bubble.remaining=Math.max(6,text.length/13);bubble.npc.lastDiscussion=text;npcVoices.speak(text,npcs.indexOf(bubble.npc));}
          chatTurn++;
          if (chatTurn === 3) { chatTurn = 0; chatWait = 3 + Math.random() * 3; }
          else chatWait = .6;
        }
        const bounds = renderer.domElement.getBoundingClientRect();
        for (const bubble of npcChatBubbles) {
          bubble.remaining -= dt;
          bubble.npc.root.getWorldPosition(chatPoint); chatPoint.y += 2.15; chatPoint.project(camera);
          bubble.element.hidden = bubble.npc===talkingNpc || bubble.remaining <= 0 || chatPoint.z < -1 || chatPoint.z > 1;
          if (bubble.element.hidden) continue;
          bubble.element.style.left = Math.max(110, Math.min(innerWidth - 110, bounds.left + (chatPoint.x + 1) * bounds.width / 2)) + 'px';
          bubble.element.style.top = Math.max(85, bounds.top + (1 - chatPoint.y) * bounds.height / 2 - 10) + 'px';
          bubble.element.style.opacity = Math.min(1, bubble.remaining / .5);
        }
      }
      function standNpc(npc) {
        if (!npc.seated) return;
        npc.root.position.copy(npc.seated.standing);
        npc.legs.forEach(leg => leg.rotation.x = 0);
        npc.knees.forEach(knee => knee.rotation.x = 0);
        npc.arms.forEach(arm => arm.rotation.x = 0);
        npc.forearms.forEach(elbow=>elbow.quaternion.identity());
        npc.seated = null; npc.wait = 1; npc.task = null;
      }
      function seatNpc(npc) {
        const station = byId[npc.task?.id]?.g, chair = station?.userData.chair;
        if (!chair) return false;
        const approach = station.localToWorld(new THREE.Vector3(-.15,0,2.05));
        if (npc.root.position.distanceTo(approach) > .65) return false;
        npc.seated = { station, chair, standing: npc.root.position.clone(), remaining: npc.role==='programming'?Infinity:12 + Math.random()*10 };
        npc.path = []; return true;
      }
      function phoneReceiver(parent){
        const receiver=new THREE.Group();parent.add(receiver);
        const plastic=M('#151d25');
        box(receiver,.045,.19,.04,plastic,0,0,0,.016);
        for(const side of [-1,1])box(receiver,.075,.055,.06,plastic,0,side*.09,.012,.018);
        return receiver;
      }
      function deskPhone(parent,x,y,z){
        const phone=new THREE.Group();phone.position.set(x,y,z);parent.add(phone);
        box(phone,.24,.055,.23,M('#202d38'),0,.03,0,.018);
        box(phone,.13,.009,.055,glow('#75bca9'),0,.064,-.065,.003);
        for(let key=0;key<12;key++)box(phone,.022,.01,.019,M('#8c9aa5'),-.038+(key%3)*.038,.065,-.01+Math.floor(key/3)*.025,.003);
        const receiver=phoneReceiver(phone);receiver.rotation.z=Math.PI/2;receiver.position.set(-.115,.10,0);
        return {phone,receiver};
      }
      const stationPhones=new Map();
      for(const id of ['mesa','mesaL','mesaLeitura','banquetaTI','setupVitoria','setupXandy','setupAlex']){
        const desk=byId[id]?.g;if(!desk)continue;
        const reading=id==='mesaLeitura',consoleTable=id==='banquetaTI';
        const phone=deskPhone(desk,reading?.45:consoleTable?.65:.60,reading?1.03:consoleTable?1.02:1.09,reading?0:consoleTable?.17:-.15);
        stationPhones.set(id,phone);
      }
      for(const npc of npcs){
        npc.phoneReceiver=phoneReceiver(npc.head);npc.phoneReceiver.position.set(-.205,-.01,.035);npc.phoneReceiver.visible=false;
        npc.nextCall=14+npcs.indexOf(npc)*13;npc.callRemaining=0;
        npc.phoneHandTarget=new THREE.Group();npc.phoneHandTarget.position.set(-.42,1.42,.035);npc.root.add(npc.phoneHandTarget);
      }
      function updateClientCall(npc,dt,t){
        const phone=stationPhones.get(npc.task?.id);if(!phone)return false;
        if(npc===talkingNpc){npc.callRemaining=0;}
        else if(npc.callRemaining<=0){
          npc.nextCall-=dt;
          if(npc.nextCall<=0){
            npc.callRemaining=9+Math.random()*5;npc.nextCall=40+Math.random()*35;
            interactionAudio.play('phoneRing',npc.root.position.distanceTo(avatar.position));
            const lines=['GuedesSEC, bom dia! Como posso ajudar com seu projeto?', 'Vou verificar seu chamado e os testes da aplicação.', 'Podemos revisar os requisitos e combinar a próxima entrega.', 'Estou conferindo a montagem e os componentes do seu computador.'];
            const text=lines[(npc.callCount||0)%lines.length];npc.callCount=(npc.callCount||0)+1;
            const bubble=npcChatBubbles.find(entry=>entry.npc===npc);bubble.element.textContent=npc.name+' ? Cliente: '+text;bubble.remaining=9;
            npcVoices.speak(text,npcs.indexOf(npc));
          }
        }
        const active=npc.callRemaining>0;npc.phoneReceiver.visible=active;phone.receiver.visible=!active;
        if(!active)return false;
        npc.callRemaining=Math.max(0,npc.callRemaining-dt);
        poseNpcTyping({root:npc.root,arms:[npc.arms[0]],forearms:[npc.forearms[0]]},{userData:{keyboard:npc.phoneHandTarget}},t*.1);
        npc.head.rotation.z=Math.sin(t*.0015)*.035;
        return true;
      }
      function poseNpcTyping(npc,station,time) {
        const keyboard=station.userData.keyboard;if(!keyboard)return;
        npc.root.updateWorldMatrix(true,true);keyboard.updateWorldMatrix(true,true);
        const down=new THREE.Vector3(0,-1,0),upperLength=npc.upperLength||.22,lowerLength=npc.lowerLength||.27;
        npc.arms.forEach((arm,i)=>{
          const side=i===0?-1:1;
          const target=keyboard.localToWorld(new THREE.Vector3(-side*.145,.063+Math.sin(time*.015+i*Math.PI)*.004,.02));
          npc.root.worldToLocal(target);
          const shoulder=arm.position.clone(),delta=target.clone().sub(shoulder);
          const distance=THREE.MathUtils.clamp(delta.length(),.025,upperLength+lowerLength-.002),direction=delta.normalize();
          const along=(upperLength*upperLength-lowerLength*lowerLength+distance*distance)/(2*distance);
          const outward=new THREE.Vector3(side*.4,-1,0).normalize();
          const bend=outward.addScaledVector(direction,-outward.dot(direction)).normalize();
          const elbowPoint=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,upperLength*upperLength-along*along)));
          arm.quaternion.setFromUnitVectors(down,elbowPoint.clone().sub(shoulder).normalize());
          const lowerDirection=target.sub(elbowPoint).normalize().applyQuaternion(arm.quaternion.clone().invert());
          npc.forearms[i].quaternion.setFromUnitVectors(down,lowerDirection);
        });
      }
      function updateNpcs(dt, t) {
        if (edit) return;
        for (const npc of npcs) {
          if(npc.role==='programming'&&!npc.workInitialized){
            const stationId=['setupVitoria','setupXandy','setupAlex'][npcs.indexOf(npc)];
            const station=byId[stationId]?.g,chair=station?.userData.chair;
            if(chair){
              npc.workInitialized=true;npc.task={id:stationId,action:'work'};npc.path=[];
              npc.seated={station,chair,standing:station.localToWorld(new THREE.Vector3(-.15,0,2.05)),remaining:Infinity};
            }
          }
          if(npc.role==='soldering'&&!npc.workInitialized){
            const work=solderWorkPosition();
            if(work){npc.root.position.copy(work.position);npc.task={id:'mesaL',action:'solder'};npc.path=[];npc.workInitialized=true;}
          }
          npc.phase += dt;
          if(npc===solderNpc){solderTool.visible=false;assemblyTool.visible=false;}
          npc.nextBlink -= dt;
          if(npc.nextBlink<=0){npc.blinkTime=.16;npc.nextBlink=2.5+Math.random()*4;}
          if(npc.blinkTime>0)npc.blinkTime=Math.max(0,npc.blinkTime-dt);
          const eyelid=npc.blinkTime>0?Math.max(.08,Math.abs(npc.blinkTime-.08)/.08):1;
          npc.eyes.forEach(eye=>eye.scale.y=eyelid);
          npc.torso.scale.y=1+Math.sin(npc.phase*1.8)*.006;
          npc.head.rotation.x=Math.sin(npc.phase*.8)*.015;
          const pos = npc.root.position;
          if(npc.role==='analyst'){
            readingChair.getWorldPosition(pos);pos.y=-.22;
            const deskPosition=readingDesk.getWorldPosition(new THREE.Vector3());
            npc.root.rotation.y=Math.atan2(deskPosition.x-pos.x,deskPosition.z-pos.z);
            npc.legs.forEach(leg=>leg.rotation.x=-Math.PI/2);npc.knees.forEach(knee=>knee.rotation.x=Math.PI/2);
            if(npc!==talkingNpc){
              poseNpcTyping(npc,{userData:{keyboard:analysisTarget}},t*.08);
              npc.head.rotation.x=.12+Math.sin(npc.phase*.6)*.035;
              npc.head.rotation.y=Math.sin(npc.phase*.4)*.12;
              analysisPage.rotation.y=Math.sin(npc.phase*.8)*.025;
              updateClientCall(npc,dt,t);
            }
            continue;
          }
          if (npc.seated) {
            const seat = npc.seated;
            if (npc !== talkingNpc) seat.remaining -= dt;
            seat.chair.getWorldPosition(pos);
            const offset = new THREE.Vector3(0,-.12,.07).applyAxisAngle(new THREE.Vector3(0,1,0),seat.station.rotation.y);
            pos.add(offset); npc.root.rotation.y = seat.station.rotation.y + Math.PI;
            npc.legs.forEach(leg => leg.rotation.x = -Math.PI/2);
            npc.knees.forEach(knee => knee.rotation.x = Math.PI/2);
            poseNpcTyping(npc,seat.station,t);
            updateClientCall(npc,dt,t);
            if (seat.remaining <= 0) standNpc(npc);
            continue;
          }
          if (!recoverNpc(npc, dt)) continue;
          if (npc === talkingNpc) continue;
          if (npc.path.length) {
            const goal = npc.path[0], dx = goal.x - pos.x, dz = goal.z - pos.z, distance = Math.hypot(dx, dz);
            const step = Math.min(distance, dt * .75);
            const x = pos.x + dx / (distance || 1) * step, z = pos.z + dz / (distance || 1) * step;
            const occupied = Math.hypot(x - avatar.position.x, z - avatar.position.z) < .6 || npcs.some(other => other !== npc && Math.hypot(x - other.root.position.x, z - other.root.position.z) < NPC_RADIUS * 2);
            if (!occupied && npcSegmentClear(pos.x, pos.z, x, z)) {
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
            if(npc.role==='soldering' && npc.task?.action==='solder') {
              const work=solderWorkPosition();
              if(work && Math.hypot(pos.x-work.position.x,pos.z-work.position.z)<.18 && npcSegmentClear(pos.x,pos.z,work.position.x,work.position.z)){
                pos.y=-.12;
                solderChair.position.set(work.x,0,work.z);
                solderChair.rotation.y=work.angle;
                npc.root.rotation.y=byId.mesaL.g.rotation.y+work.angle;
                solderTarget.position.set(work.tx,1.015,work.tz);
                solderTarget.rotation.y=Math.PI+work.angle;
                solderBoard.position.set(work.tx+.12,0,work.tz+.27);
                npc.legs.forEach(leg=>leg.rotation.x=-Math.PI/2);
                npc.knees.forEach(knee=>knee.rotation.x=Math.PI/2);
                npc.workTime=(npc.workTime||0)+dt;
                const workStage=Math.floor(npc.workTime/12)%6;
                const assembling=workStage!==0;
                const inspecting=npc.workTime%11>8;
                assemblyPc.visible=assembling;solderBoard.visible=!assembling;
                assemblyPc.position.set(work.tx,0,work.tz);
                assemblyPc.rotation.y=work.angle;
                poseNpcTyping(npc,solderStation,t*(inspecting?.08:assembling?.7:.35));
                npc.head.rotation.x=inspecting?.03:.18;
                solderTool.visible=!assembling&&!inspecting;
                assemblyTool.visible=assembling&&!inspecting;
                if(assembling&&!inspecting){
                  // Instalação, parafusos, cabos e teste têm ritmos diferentes.
                  npc.forearms[1].rotateY(Math.sin(npc.workTime*(workStage===3?12:4))*(workStage===3?.35:.12));
                  npc.head.rotation.y=Math.sin(npc.workTime*.8)*.07;
                }
                if(updateClientCall(npc,dt,t)){solderTool.visible=false;assemblyTool.visible=false;}
                assemblyTestLed.material.color.set(workStage===5?'#4de6a0':'#26343b');
                assemblyRam.position.y=workStage===2?1.13+Math.max(0,1-(npc.workTime%12)/7)*.10:1.13;
                assemblyDrive.position.x=workStage===4?.09+Math.max(0,1-(npc.workTime%12)/7)*.09:.09;
                continue;
              }
            }
            if(npc.role==='soldering'){
              pos.y=0;npc.legs.forEach(leg=>leg.rotation.x=0);npc.knees.forEach(knee=>knee.rotation.x=0);
              npc.arms.forEach(arm=>arm.rotation.set(0,0,0));
              npc.forearms.forEach(arm=>arm.rotation.set(0,0,0));
              npc.wait-=dt;if(npc.wait<=0){planNpcTask(npc);npc.wait=4;}continue;
            }
            if (seatNpc(npc)) continue;
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
      let walkPath = [];
      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const NAV_CELL_SIZE = .25;
      const NAV_MIN_X = ROOM.minX + NAV_CELL_SIZE;
      const NAV_MIN_Z = ROOM.minZ + NAV_CELL_SIZE;
      const NAV_COLUMNS = Math.floor((ROOM.maxX - NAV_CELL_SIZE - NAV_MIN_X) / NAV_CELL_SIZE) + 1;
      const NAV_ROWS = Math.floor((ROOM.maxZ - NAV_CELL_SIZE - NAV_MIN_Z) / NAV_CELL_SIZE) + 1;
      function navigationPosition(index) {
        return {
          x: NAV_MIN_X + index % NAV_COLUMNS * NAV_CELL_SIZE,
          z: NAV_MIN_Z + Math.floor(index / NAV_COLUMNS) * NAV_CELL_SIZE
        };
      }
      function navigationSegmentClear(ax, az, bx, bz) {
        const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / .05));
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps;
          if (avatarBlocked(ax + (bx - ax) * ratio, az + (bz - az) * ratio)) return false;
        }
        return true;
      }
      function nearestWalkableCell(x, z, from = null) {
        const originX = THREE.MathUtils.clamp(Math.round((x - NAV_MIN_X) / NAV_CELL_SIZE), 0, NAV_COLUMNS - 1);
        const originZ = THREE.MathUtils.clamp(Math.round((z - NAV_MIN_Z) / NAV_CELL_SIZE), 0, NAV_ROWS - 1);
        const maxRadius = Math.max(NAV_COLUMNS, NAV_ROWS);
        for (let radius = 0; radius <= maxRadius; radius++) {
          let best = null, bestDistance = Infinity;
          for (let dz = -radius; dz <= radius; dz++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (radius && Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;
              const column = originX + dx, row = originZ + dz;
              if (column < 0 || column >= NAV_COLUMNS || row < 0 || row >= NAV_ROWS) continue;
              const index = row * NAV_COLUMNS + column, position = navigationPosition(index);
              if (avatarBlocked(position.x, position.z)) continue;
              if (from && !navigationSegmentClear(from.x, from.z, position.x, position.z)) continue;
              const distance = (position.x - x) ** 2 + (position.z - z) ** 2;
              if (distance < bestDistance) {
                best = { index, ...position };
                bestDistance = distance;
              }
            }
          }
          if (best) return best;
        }
        return null;
      }
      function findWalkPath(destination) {
        const start = nearestWalkableCell(avatar.position.x, avatar.position.z, avatar.position);
        const goal = nearestWalkableCell(destination.x, destination.z);
        if (!start || !goal) return null;

        const total = NAV_COLUMNS * NAV_ROWS;
        const costs = new Float64Array(total).fill(Infinity);
        const parents = new Int32Array(total).fill(-1);
        const closed = new Uint8Array(total);
        const open = [];
        function push(entry) {
          let index = open.length;
          open.push(entry);
          while (index > 0) {
            const parent = (index - 1) >> 1;
            if (open[parent].score <= entry.score) break;
            open[index] = open[parent];
            index = parent;
          }
          open[index] = entry;
        }
        function pop() {
          const first = open[0], last = open.pop();
          if (open.length) {
            let index = 0;
            while (true) {
              const left = index * 2 + 1, right = left + 1;
              if (left >= open.length) break;
              const child = right < open.length && open[right].score < open[left].score ? right : left;
              if (open[child].score >= last.score) break;
              open[index] = open[child];
              index = child;
            }
            open[index] = last;
          }
          return first;
        }
        function heuristic(index) {
          const column = index % NAV_COLUMNS, row = Math.floor(index / NAV_COLUMNS);
          const dx = Math.abs(column - goal.index), dz = Math.abs(row - Math.floor(goal.index / NAV_COLUMNS));
          return (Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)) * NAV_CELL_SIZE;
        }
        costs[start.index] = 0;
        push({ index: start.index, score: heuristic(start.index) });
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        while (open.length) {
          const current = pop(), index = current.index;
          if (closed[index]) continue;
          if (index === goal.index) break;
          closed[index] = 1;
          const column = index % NAV_COLUMNS, row = Math.floor(index / NAV_COLUMNS);
          for (const [dx, dz] of directions) {
            const nextX = column + dx, nextZ = row + dz;
            if (nextX < 0 || nextX >= NAV_COLUMNS || nextZ < 0 || nextZ >= NAV_ROWS) continue;
            const next = nextZ * NAV_COLUMNS + nextX;
            if (closed[next]) continue;
            const position = navigationPosition(next);
            if (avatarBlocked(position.x, position.z)) continue;
            const currentPosition = navigationPosition(index);
            if (!navigationSegmentClear(currentPosition.x, currentPosition.z, position.x, position.z)) continue;
            if (dx && dz) {
              const sideX = navigationPosition(row * NAV_COLUMNS + nextX);
              const sideZ = navigationPosition(nextZ * NAV_COLUMNS + column);
              if (avatarBlocked(sideX.x, sideX.z) || avatarBlocked(sideZ.x, sideZ.z)) continue;
            }
            const candidate = costs[index] + NAV_CELL_SIZE * (dx && dz ? Math.SQRT2 : 1);
            if (candidate >= costs[next]) continue;
            costs[next] = candidate;
            parents[next] = index;
            push({ index: next, score: candidate + heuristic(next) });
          }
        }
        if (start.index !== goal.index && parents[goal.index] === -1) return null;

        const points = [];
        for (let index = goal.index; index !== start.index; index = parents[index]) {
          points.push(navigationPosition(index));
        }
        points.reverse();
        const goalPosition = points[points.length - 1] || start;
        if (navigationSegmentClear(goalPosition.x, goalPosition.z, destination.x, destination.z)) {
          points.push({ x: destination.x, z: destination.z });
        }
        const path = [];
        let from = { x: avatar.position.x, z: avatar.position.z }, cursor = 0;
        while (cursor < points.length) {
          let next = points.length - 1;
          while (next > cursor && !navigationSegmentClear(from.x, from.z, points[next].x, points[next].z)) next--;
          if (!navigationSegmentClear(from.x, from.z, points[next].x, points[next].z)) return null;
          from = points[next];
          path.push(new THREE.Vector3(from.x, 0, from.z));
          cursor = next + 1;
        }
        return path;
      }
      function walkTo(destination) {
        const path = findWalkPath(destination);
        if (!path) {
          walkTarget = null;
          walkPath = [];
          document.getElementById('status').textContent = 'Não encontrei um caminho livre até esse ponto.';
          return false;
        }
        walkPath = path;
        walkTarget = walkPath.shift() || null;
        return true;
      }
      let tapOrigin = null, tapMoved = false, pinchDistance = 0;
      const touches = new Map(), canvas = renderer.domElement;
      const adminTerminal=createAdminTerminal(()=>['bancadaTI','instrumentosTI','rackExtraTI','pecasTI'].map(id=>({label:byId[id].label,position:byId[id].g.position.toArray(),online:!(serverIncident.down&&serverIncident.rackId===id)})),{
        getIncident:()=>serverIncident.down&&!serverIncident.repairRequested?{id:serverIncident.id,label:byId[serverIncident.rackId].label}:null,
        repair:id=>{if(!serverIncident.down||serverIncident.id!==id||serverIncident.repairRequested)return false;serverIncident.repairRequested=true;return true;}
      });
      function openAdminConsole(){keys.clear();walkTarget=null;adminTerminal.open();}
      function isDecorativeFrame(o){
        return !!o&&(!!pictureFrames[o.id]||o.id==='githubPerfil'||/^(quadro|lousa)/i.test(o.id)||/quadro|lousa/i.test(o.label));
      }
      function activateAt(e) {
        point(e);
        const hitScreen=ray.intersectObjects([...playableScreens.keys()],false)[0];
        const hitScene=ray.intersectObjects(objects.map(o=>o.g),true).find(h=>isSceneVisible(h.object));
        if(hitScreen && (!hitScene || hitScreen.distance<=hitScene.distance+.025)) {openAnyScreen(playableScreens.get(hitScreen.object));return;}

        point(e);
        const npcHit = ray.intersectObjects(npcs.map(n => n.root), true)[0];
        const objectHit = ray.intersectObjects(objects.map(o => o.g), true).find(h => isSceneVisible(h.object));
        if (npcHit && (!objectHit || npcHit.distance < objectHit.distance)) {
          let node = npcHit.object;
          while (node && !npcs.some(n => n.root === node)) node = node.parent;
          const npc = npcs.find(n => n.root === node);
          if (npc) { openNpcConversation(npc); return; }
        }
        if(objectHit) {
          for(let node=objectHit.object;node;node=node.parent)if(node.userData.interaction==='coffee') {
            interactionAudio.play('coffee');node.userData.sipUntil=performance.now()+900;keys.clear();return;
          }
        }
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
          if (ray.ray.intersectPlane(floorPlane, destination)
            && destination.x >= ROOM.minX && destination.x <= ROOM.maxX
            && destination.z >= ROOM.minZ && destination.z <= ROOM.maxZ) {
            stopInteraction();
            keys.clear();
            walkTo(destination);
          }
          return;
        }
        if(isDecorativeFrame(o))return;
        walkTarget = null;
        walkPath = [];
        keys.clear();
        if(o.id==='geladeiraEnergeticos'){toggleEnergyFridge();return;}
        if(o.id==='banquetaTI'){openAdminConsole();return;}
        if(isDecorativeFrame(o))return;
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
        if (touches.size > 1) { release(); pinchDistance = fingerDistance();const [a,b]=[...touches.values()];touchCenter={x:(a.x+b.x)/2,y:(a.y+b.y)/2}; }
      });
      canvas.addEventListener('pointermove', e => {
        if (!touches.has(e.pointerId)) return;
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size > 1) {
          const distance = fingerDistance();
          if (pinchDistance > 0) zoom = THREE.MathUtils.clamp(zoom * distance / pinchDistance, .6, 2.5);
          const [a,b]=[...touches.values()],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
          if(touchCenter)panCamera(center.x-touchCenter.x,center.y-touchCenter.y);touchCenter=center;
          pinchDistance = distance;
        }
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, e => {
        touches.delete(e.pointerId); pinchDistance = 0; touchCenter=null;
      }));
      renderer.domElement.addEventListener('pointerdown', e => { if(touches.size>1)return; if(e.button===1||e.button===2||e.shiftKey){e.preventDefault();panDrag=true;tapMoved=true;tapOrigin=null;oldX=e.clientX;oldY=e.clientY;canvas.setPointerCapture(e.pointerId);return;} if(e.button!==0)return; tapOrigin = { x: e.clientX, y: e.clientY }; tapMoved = false; oldY = e.clientY; oldX = e.clientX; if (edit) { const o = target(e); if (o) { select(o); setupPlane(o); point(e); if (ray.ray.intersectPlane(plane, hit)) { offset.copy(o.g.position).sub(hit); dragging = true; renderer.domElement.setPointerCapture(e.pointerId) } } } else { camDrag = true; renderer.domElement.setPointerCapture(e.pointerId) } }); renderer.domElement.addEventListener('pointermove', e => { if(touches.size>1)return; if(panDrag){panCamera(e.clientX-oldX,e.clientY-oldY);oldX=e.clientX;oldY=e.clientY;return;} if(!tapOrigin)return; if (tapOrigin && Math.hypot(e.clientX - tapOrigin.x, e.clientY - tapOrigin.y) > 6) tapMoved = true; if (!tapMoved) return; if (edit && dragging && selected) { point(e); if (ray.ray.intersectPlane(plane, hit)) { const p = hit.clone().add(offset); if (selected.kind === 'wallBack') { selected.g.position.x = THREE.MathUtils.clamp(p.x, -4, 4); selected.g.position.y = THREE.MathUtils.clamp(p.y, .6, 2.7) } else if (selected.kind === 'wallLeft') { selected.g.position.z = THREE.MathUtils.clamp(p.z, -3, 3); selected.g.position.y = THREE.MathUtils.clamp(p.y, 1.2, 2) } else { moveSafe(selected, new THREE.Vector3(p.x, selected.g.position.y, p.z)) } } } else if (camDrag) { yaw += (e.clientX - oldX) * .006; pitch = THREE.MathUtils.clamp(pitch + (e.clientY - oldY) * .005, .15, 1.45); oldX = e.clientX; oldY = e.clientY; cameraUpdate() } }); function release(e) { if (e && e.type === 'pointerup' && e.pointerType !== 'mouse' && tapOrigin && !tapMoved && !edit) activateAt(e); tapOrigin = null; const wasDragging = dragging; dragging = false; camDrag = false; panDrag=false; if (wasDragging && edit) save() } renderer.domElement.addEventListener('pointerup', release); renderer.domElement.addEventListener('pointercancel', release); renderer.domElement.addEventListener('lostpointercapture', release); renderer.domElement.addEventListener('wheel', e => { e.preventDefault(); zoom=THREE.MathUtils.clamp(zoom*Math.exp(-Math.max(-200,Math.min(200,e.deltaY))*.0015),.5,4) }, { passive: false });
      canvas.addEventListener('contextmenu',e=>e.preventDefault());
      // O clique nativo do mouse ocorre depois do pointerup e da liberação da captura.
      canvas.addEventListener('click', e => {
        if (e.button!==0 || e.pointerType === 'touch' || e.pointerType === 'pen' || edit || tapMoved) return;
        activateAt(e);
      });
      document.getElementById('edit').onclick = () => { edit = !edit; walkTarget = null; if (edit) stopInteraction(); release(); keys.clear(); document.getElementById('edit').textContent = edit ? '✓ Concluir organização' : 'Ativar modo construção'; document.getElementById('edit').classList.toggle('active', edit); document.getElementById('status').textContent = edit ? 'Modo construção ativo • alterações salvas automaticamente' : 'Explore o escritório.'; if (!edit) select(null) };
      function syncRotationInputs() {
        const angle = selected ? ((selected.g.rotation.y * 180 / Math.PI) % 360 + 360) % 360 : 0;
        for (const id of ['rotationAngle', 'rotationNumber']) {
          const input = document.getElementById(id);
          input.disabled = !selected; input.value = Math.round(angle * 10) / 10;
        }
        document.getElementById('rotationValue').textContent = Math.round(angle * 10) / 10 + String.fromCharCode(176);
      }
      for (const id of ['rotationAngle', 'rotationNumber']) {
        document.getElementById(id).addEventListener('input', e => {
          if (!selected || e.target.value === '' || !Number.isFinite(e.target.valueAsNumber)) return;
          moveSafe(selected, selected.g.position.clone(), e.target.valueAsNumber * Math.PI / 180);
          syncRotationInputs(); save();
        });
      }

      const requestedOrganization = {
        arCondicionado: [4.30,2.95,1.85,-Math.PI/2],
        geladeiraEnergeticos: [3.95,0,2.98,-Math.PI/2],
        bancadaTI: [5.2, 0, -2.85, 0],
        instrumentosTI: [6.4, 0, -2.85, 0],
        rackExtraTI: [7.6, 0, -2.85, 0],
        pecasTI: [8.8, 0, -2.85, 0],
        banquetaTI: [9.08464424281584, 0, -1.4285648136090083, 4.703662334124719],
        vaso: [8.731093481333355, 0, .4170377719519799, 0],
        piaBanheiro: [5.353535584769689, 0, .4406883099244163, 0],
        chuveiro: [8.45, 0, 2.6, 0],
        mesa: [0, 0, -2.65, .03199770295322937],
        monitor1: [-1.5227275367656663, 1.11, -2.5874783616675288, .5672320068981571],
        monitor2: [-.011086978329882147, 1.11, -2.9021890038944402, 0],
        pc: [1.7913097654433603, 1.0975, -2.915292208186156, -Math.PI / 2],
        cadeira: [-.22722034206722663, 0, -1.6326652151547938, Math.PI],
        bibliotecaNova: [-4.192220709077218, 0, 2.31625751077874, Math.PI / 2],
        mesaLeitura: [-2.35, 0, 1.45, 0],
        cadeiraLeitura: [-2.35, 0, 2.28, 0],
        mesaL: [-3.3319367014599144, 0, 3.9796839455646427, 0],
        lousa: [-2.95, 2.4, -3.35, 0],
        modemWifi: [1.9, 2.7, -3.29, 0],
        quadro1: [-.95, 2.45, -3.35, 0],
        quadro2: [-.02, 2.45, -3.35, 0],
        quadro3: [.92, 2.45, -3.35, 0],
        cortina: [-4.34, 1.8850432070053282, .28129587945175505, 0],
        mousepad: [-.005082124743097938, 1.115, -2.339082171975463, 0],
        teclado: [-.2622299491939072, 1.11715, -2.3625224238267415, 0],
        mouse: [.4648254288929431, 1.121, -2.287942702456061, 0],
        tv: [3.15, 1.9, -3.34, 0],
        setupVitoria: [-2.05, 0, 7.7, Math.PI],
        setupXandy: [2.5, 0, 7.7, Math.PI],
        setupAlex: [7.05, 0, 7.7, Math.PI],
        lousaNPCs: [-2.9, 2.05, 3.6, 0],
        quadroMaquiavel: [2.400962335849037, 2.05, 3.6004794534907893, 0],
        quadroCodejohn: [-4.385307445285887, 2.05, -2.1471003505448736, Math.PI / 2],
        quadroLinux: [8.103119482491138, 2.05, 3.630730329242366, 0],
        githubPerfil: [5.15675999238516, 2.05, 3.5962166028556877, 0]
      };
      for (const [id, position] of Object.entries(requestedOrganization)) {
        const object = byId[id];
        object.initial = [...position];
        object.g.position.set(...position.slice(0, 3));
        object.g.rotation.y = position[3];
      }
      const layoutVersion = 4;
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
      const floorInputs={pattern:'floorPattern',tint:'floorTint',grout:'floorGrout',scale:'floorScale',joint:'floorJoint',direction:'floorDirection',finish:'floorFinish'};
      function syncFloorEditor() {
        const room=document.getElementById('floorRoom').value;
        const style=environmentStyle.floors[room==='all'?'lab':room];
        for(const [key,id] of Object.entries(floorInputs))document.getElementById(id).value=style[key];
      }
      document.getElementById('floorRoom').onchange=syncFloorEditor;
      for(const [key,id] of Object.entries(floorInputs)) {
        const input=document.getElementById(id);
        input.addEventListener('input',()=>{
          const room=document.getElementById('floorRoom').value;
          const value=['scale','joint','direction'].includes(key)?Number(input.value):input.value;
          for(const zone of room==='all'?Object.keys(floorZones):[room]){environmentStyle.floors[zone][key]=value;drawEnvironmentFloor(zone);}
        });input.addEventListener('change',save);
      }
      document.getElementById('resetFloor').onclick=()=>{for(const id of Object.keys(floorZones)){environmentStyle.floors[id]={...defaultFloorStyle};drawEnvironmentFloor(id);}syncFloorEditor();save();};
      document.getElementById('wallFinish').onchange=e=>{environmentStyle.wallFinish=e.target.value;for(const material of Object.values(wallMaterials))material.roughness={matte:.9,satin:.55,polished:.2}[e.target.value];save();};
      const indoorFill=new THREE.DirectionalLight('#f5dfc3',0);indoorFill.position.set(2,8,4);scene.add(indoorFill);
      let lastDaylightUpdate=-Infinity;
      const daylightSky=new THREE.Color(),daylightSun=new THREE.Color();
      function updateDaylight(time,force=false) {
        if(!force&&time-lastDaylightUpdate<10000)return;lastDaylightUpdate=time;
        const clock=saoPauloTime();document.getElementById('daylightClock').textContent=clock.label+' / Sao Paulo';
        if(!environmentStyle.daylight) {
          skyLight.intensity=2.3;skyLight.color.set('#e3f4ff');sun.intensity=3.3;sun.color.set('#fff3dc');sun.position.set(-4,11,7);indoorFill.intensity=0;scene.backgroundIntensity=1;renderer.toneMappingExposure=environmentStyle.exposure;return;
        }
        const state=daylightAt(clock.hour);
        skyLight.intensity=state.sky;skyLight.color.set(state.skyA).lerp(daylightSky.set(state.skyB),state.blend);
        sun.intensity=state.sun;sun.color.set(state.sunA).lerp(daylightSun.set(state.sunB),state.blend);
        const angle=(clock.hour-6)/12*Math.PI;sun.position.set(Math.cos(angle)*10,Math.max(2,Math.sin(angle)*14),7);
        indoorFill.intensity=THREE.MathUtils.lerp(.7,0,THREE.MathUtils.clamp(state.sun/2,0,1));
        scene.backgroundIntensity=state.background;renderer.toneMappingExposure=environmentStyle.exposure*state.exposure;
      }
      const daylightToggle=document.getElementById('daylightEnabled');
      daylightToggle.onchange=()=>{environmentStyle.daylight=daylightToggle.checked;updateDaylight(0,true);save();};
      document.getElementById('roomExposure').oninput=e=>{environmentStyle.exposure=Number(e.target.value);updateDaylight(0,true);};
      document.getElementById('roomExposure').onchange=save;
      const roomAudio=createRoomAudio();
      const effectsToggle=document.getElementById('effectsEnabled'),effectsVolume=document.getElementById('effectsVolume');
      effectsToggle.checked=interactionAudio.settings.enabled;effectsVolume.value=Math.round(interactionAudio.settings.volume*100);
      effectsToggle.onchange=()=>interactionAudio.setEnabled(effectsToggle.checked);effectsVolume.oninput=()=>interactionAudio.setVolume(Number(effectsVolume.value)/100);

      const voicesToggle=document.getElementById('npcVoicesEnabled'),voicesVolume=document.getElementById('npcVoicesVolume');
      voicesToggle.checked=npcVoices.settings.enabled;voicesToggle.disabled=!npcVoices.supported;voicesVolume.value=Math.round(npcVoices.settings.volume*100);
      voicesToggle.onchange=()=>npcVoices.setEnabled(voicesToggle.checked);voicesVolume.oninput=()=>npcVoices.setVolume(Number(voicesVolume.value)/100);
      const voiceChoices=document.createElement('div');voiceChoices.className='environmentFields';
      document.getElementById('npcVoicesNote').before(voiceChoices);
      const voiceSelectors=npcs.map((npc,index)=>{
        const label=document.createElement('label');label.textContent='Voz de '+npc.name;
        const select=document.createElement('select');select.setAttribute('aria-label','Voz de '+npc.name);label.append(select);voiceChoices.append(label);
        select.onchange=()=>{npcVoices.setVoice(index,select.value);npcVoices.speak('Olá! Vamos conversar sobre o projeto?',index,true);};return select;
      });
      function updateVoiceChoices(){const voices=npcVoices.getVoices();voiceSelectors.forEach((select,index)=>{
        select.replaceChildren(new Option('Automatica / portugues',''));
        voices.forEach(voice=>select.add(new Option(voice.name+' / '+voice.lang,voice.voiceURI)));
        select.value=npcVoices.settings.voiceNames[index]||'';
      });}
      updateVoiceChoices();window.speechSynthesis?.addEventListener('voiceschanged',updateVoiceChoices);
      if(!npcVoices.supported)document.getElementById('npcVoicesNote').textContent='Este navegador nao oferece vozes. As bolhas continuam funcionando.';

      const ambientToggle=document.getElementById('ambientEnabled'),ambientVolume=document.getElementById('ambientVolume');
      ambientToggle.checked=roomAudio.settings.enabled;ambientVolume.value=Math.round(roomAudio.settings.volume*100);
      ambientToggle.onchange=()=>roomAudio.setEnabled(ambientToggle.checked);
      ambientVolume.oninput=()=>{roomAudio.setVolume(Number(ambientVolume.value)/100);document.getElementById('ambientVolumeValue').textContent=ambientVolume.value+'%';};
      document.getElementById('ambientVolumeValue').textContent=ambientVolume.value+'%';

      function save() {
        const data = { grayPaletteVersion: 1, utilityPlacementVersion: 2, layoutVersion, environmentStyle, serverRoomVersion: 2, wallPaint: Object.fromEntries(Object.entries(wallMaterials).map(([side, material]) => [side, '#' + material.color.getHexString()])) };
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
      let arrangeUtilities=false;
      let applyGrayPalette=true;
      let applyRequestedLayout = false;
      let alignServerRoom = false;
      try {
        const currentSaved = localStorage.getItem(storage);
        const saved = JSON.parse(currentSaved || previousStorages.map(key => localStorage.getItem(key)).find(Boolean) || '{}');
        // Layout escolhido pelo usuario sempre tem prioridade sobre o padrao do codigo.
        applyGrayPalette=saved.grayPaletteVersion!==1;
        applyRequestedLayout = false;
        if(saved.environmentStyle) {
          const stored=saved.environmentStyle;
          environmentStyle.daylight=stored.daylight!==false;
          for(const id of Object.keys(floorZones)) {
            const floor=stored.floors?.[id];if(!floor)continue;
            const safe={...defaultFloorStyle};
            if(['square','rectangle','wood','hex','plain'].includes(floor.pattern))safe.pattern=floor.pattern;
            for(const key of ['tint','grout'])if(/^#[0-9a-f]{6}$/i.test(floor[key]))safe[key]=floor[key];
            if(Number.isFinite(floor.scale))safe.scale=THREE.MathUtils.clamp(floor.scale,.3,2);
            if(Number.isFinite(floor.joint))safe.joint=THREE.MathUtils.clamp(floor.joint,1,12);
            if([0,45,90].includes(floor.direction))safe.direction=floor.direction;
            if(['matte','satin','polished'].includes(floor.finish))safe.finish=floor.finish;
            environmentStyle.floors[id]=safe;drawEnvironmentFloor(id);
          }
          if(['matte','satin','polished'].includes(stored.wallFinish))environmentStyle.wallFinish=stored.wallFinish;
          for(const material of Object.values(wallMaterials))material.roughness={matte:.9,satin:.55,polished:.2}[environmentStyle.wallFinish];
          if(Number.isFinite(stored.exposure))environmentStyle.exposure=THREE.MathUtils.clamp(stored.exposure,.6,2);
          renderer.toneMappingExposure=environmentStyle.exposure;
          document.getElementById('roomExposure').value=environmentStyle.exposure;document.getElementById('wallFinish').value=environmentStyle.wallFinish;
        }
        daylightToggle.checked=environmentStyle.daylight;updateDaylight(0,true);
        syncFloorEditor();
        arrangeUtilities=saved.utilityPlacementVersion!==2;
        alignServerRoom = false;
        for (const [side, material] of Object.entries(wallMaterials)) {
          const color = saved.wallPaint?.[side];
          if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) material.color.set(color);
        }
        syncWallColor();
        for (const o of objects) {
          const s = saved[o.id];
          if (s && Array.isArray(s.p) && s.p.length === 3 && s.p.every(Number.isFinite)) {
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
      if(applyGrayPalette) {
        wallMaterials.back.color.set('#b9bec3');wallMaterials.left.color.set('#b9bec3');
        wallMaterials.front.color.set('#d8dbde');wallMaterials.right.color.set('#d8dbde');
        for(const material of Object.values(wallMaterials))material.roughness=.9;
        environmentStyle.wallFinish='matte';document.getElementById('wallFinish').value='matte';
        for(const id of Object.keys(floorZones)) {
          Object.assign(environmentStyle.floors[id],{tint:'#565c63',grout:'#3e444a',finish:'matte'});drawEnvironmentFloor(id);
        }
        syncWallColor();syncFloorEditor();save();
      }
      if (applyRequestedLayout) {
        for (const [id, position] of Object.entries(requestedOrganization)) {
          const object = byId[id];
          object.g.position.set(...position.slice(0, 3));
          object.g.rotation.y = position[3];
        }
      }
      if (alignServerRoom) {
        for(const [id,x] of [['bancadaTI',5.2],['instrumentosTI',6.4],['rackExtraTI',7.6],['pecasTI',8.8]]) {
          byId[id].g.position.set(x,0,-2.85);byId[id].g.rotation.y=0;
        }
      }
      if (applyRequestedLayout || alignServerRoom) save();
      if(arrangeUtilities) {
        for(const id of ['geladeiraEnergeticos']) {
          const position=requestedOrganization[id],object=byId[id];object.g.position.set(...position.slice(0,3));object.g.rotation.y=position[3];
        }
        save();
      }
      addEventListener('keydown', e => {
        if (e.target.matches('input, textarea, select')) return;
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
      function show(o) { if(isDecorativeFrame(o))return; if(o.id==='geladeiraEnergeticos'){toggleEnergyFridge();return;} if(o.id==='banquetaTI'){openAdminConsole();return;} document.getElementById('dt').textContent = o.label; document.getElementById('dd').textContent = o.desc; document.getElementById('dialog').style.display = 'flex'; keys.clear() }
      document.getElementById('close').onclick = () => document.getElementById('dialog').style.display = 'none';
      document.getElementById('dialog').onclick = e => { if (e.target.id === 'dialog') e.currentTarget.style.display = 'none' };
      let prev = performance.now(), walk = 0, lastMobileFrame = 0;
      function loop(t) {
        requestAnimationFrame(loop);
        if (document.hidden || (isMobile && t - lastMobileFrame < 1000 / 30)) return;
        if (isMobile) lastMobileFrame = t;
        const dt = Math.min((t - prev) / 1000, .05);
        const cameraBlend=1-Math.exp(-16*dt);
        if(Math.abs(viewYaw-yaw)+Math.abs(viewPitch-pitch)+Math.abs(viewZoom-zoom)+cameraCenter.distanceTo(cameraGoal)>.00001) {
          viewYaw=THREE.MathUtils.lerp(viewYaw,yaw,cameraBlend);viewPitch=THREE.MathUtils.lerp(viewPitch,pitch,cameraBlend);viewZoom=THREE.MathUtils.lerp(viewZoom,zoom,cameraBlend);cameraCenter.lerp(cameraGoal,cameraBlend);cameraUpdate();
        }
        prev = t;
        if (!edit && document.getElementById('dialog').style.display !== 'flex' && !interactionPose) {
          let dx = 0, dz = 0;
          if (keys.has('w') || keys.has('arrowup')) dz--;
          if (keys.has('s') || keys.has('arrowdown')) dz++;
          if (keys.has('a') || keys.has('arrowleft')) dx--;
          if (keys.has('d') || keys.has('arrowright')) dx++;
          if (dx || dz) { walkTarget = null; walkPath = []; }
          let step = dt * 2.3;
          if (walkTarget) {
            dx = walkTarget.x - avatar.position.x;
            dz = walkTarget.z - avatar.position.z;
            const remaining = Math.hypot(dx, dz);
            if (remaining < .025) {
              walkTarget = walkPath.shift() || null;
              if (!walkTarget) dx = dz = 0;
            }
            if (walkTarget) {
              dx = walkTarget.x - avatar.position.x;
              dz = walkTarget.z - avatar.position.z;
              step = Math.min(step, Math.hypot(dx, dz));
            }
          }
          const len = Math.hypot(dx, dz);
          if (len) {
            dx /= len; dz /= len;
            const previousX = avatar.position.x, previousZ = avatar.position.z;
            const nx = previousX + dx * step, nz = previousZ + dz * step;
            if (!avatarBlocked(nx, avatar.position.z)) avatar.position.x = nx;
            if (!avatarBlocked(avatar.position.x, nz)) avatar.position.z = nz;
            if (walkTarget && avatar.position.x === previousX && avatar.position.z === previousZ) {
              walkTarget = null;
              walkPath = [];
            }
            avatar.rotation.y = Math.atan2(dx, dz);
            if(avatar.position.x!==previousX||avatar.position.z!==previousZ)interactionAudio.play('step');
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
            poseNpcTyping({root:avatar,arms,forearms:elbows,upperLength:.28,lowerLength:.265},{userData:{keyboard:byId.teclado.g}},t);
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
        npcVoices.updateProximity();
        paintScreens();
        paintNativeScreens(t);
        updateMonitoring(t,dt);
        const typingSources=interactionPose==='typing'?[{id:'player',distance:0}]:[];
        if(interactionPose==='mouse')interactionAudio.play('mouse');
        const typingNpc=npcs.find(n=>n.seated&&!n.callRemaining&&n.root.position.distanceTo(avatar.position)<4);
        if(typingNpc)typingSources.push({id:typingNpc.name,distance:typingNpc.root.position.distanceTo(avatar.position)});
        interactionAudio.updateTyping(typingSources);
        for(const cup of interactiveCups){const remaining=cup.userData.sipUntil-t;const motion=remaining>0?Math.sin((1-remaining/900)*Math.PI):0;cup.rotation.z=motion*.28;cup.position.y=cup.userData.restY+motion*.12;}
        updateEnergyDrink(dt);
        fridgeDoor.rotation.y=THREE.MathUtils.lerp(fridgeDoor.rotation.y,fridgeOpen?-1.35:0,1-Math.exp(-8*dt));
        updateDaylight(t);
        const mediaAudible=[...playableScreens.values()].some(m=>m.contentKind==='video'&&!m.video.paused&&!m.video.muted||m.contentKind==='website'&&m.audioEnabled);
        roomAudio.update(avatar.position,mediaAudible||npcVoices.speaking,npcs.some(n=>n.seated),{speaker:ambientSpeaker.getWorldPosition(new THREE.Vector3()),ac:ac.getWorldPosition(new THREE.Vector3())});
        updateStationCables(t);
        updateServerIncident(dt,t);
        serverIndicators.forEach(({mesh,phase})=>{
          const failed=serverIncident.down&&mesh.parent===byId[serverIncident.rackId]?.g;
          mesh.material.color.setHex(failed?(Math.sin(t*.012)>0?0xff2448:0x4d1020):(Math.sin(t*.009+phase)>.15?0x65f5a9:0x163b2d));
        });
        updateActiveRoomWalls();
        renderer.render(scene, camera);
        updateNpcChats(dt);
        renderMonitorVideos();
      }
      requestAnimationFrame(loop);
    } catch (e) { fail(e) }
