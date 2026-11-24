// 모든 화면 문구 (한국어 / 영어). 화면 문구는 해요체, 버튼은 "~하기".
(function () {
  var KO = {
    title_sub: 'DICE ORRERY',
    m_continue: '이어하기', m_new: '새로 시작하기', m_settings: '설정하기', m_credits: '크레딧 보기', m_confirmNew: '정말 새로 시작할까요? 지금 기록은 지워져요.', m_yes: '지우고 시작하기', m_no: '돌아가기',
    tab_machine: '기계', tab_upg: '개량', tab_dice: '주사위', tab_nova: '초신성', tab_col: '붕괴', tab_rec: '기록',
    roll: '굴리기', per_sec: '/초',
    power: '굴림 질량', wind: '자동 굴림', dice: '주사위 개수', forge: '관측 의뢰',
    b_power: '강화하기', b_wind: '가속하기', b_dice: '추가하기', b_forge: '옮기러 가기', b_buy: '구매하기', b_research: '연구하기',
    power_eff: '굴림마다 ×{0}', wind_none: '손으로만 굴려요', wind_eff: '{0}초마다 굴림', wind_max: '가장 빨라요',
    dice_eff: '궤도 {0}~{1}', dice_max: '쟁반이 가득 찼어요', forge_eff: '눈을 다른 면으로 옮겨요', forge_lock: '주사위 3개부터 열려요',
    lv: 'Lv {0}', n_dice: '{0}개', n_forge: '남은 횟수 {0}',
    dist: '합의 분포', recent: '최근 합', rarity: '희소도',
    upg_hidden: '더 모으면 열려요', bought: '구매함',
    // 주사위 탭
    pick_face: '눈을 뺄 면을 고르세요', pick_to: '눈을 넣을 면을 고르세요', face_max: '이 면은 가득 찼어요', face_min: '빈 면이에요', moves_left: '남은 옮기기 {0}번', no_moves: '옮기기 횟수를 다 썼어요', tip_moves: '이번 판에서 처음 보는 천체 단계가 태어날 때마다 +{0}번', b_cancel: '취소하기',
    shape_title: '주사위 모양', tray_cap: '쟁반 칸 {0}/{1}', change_shape: '바꾸기',
    std_dist: '처음 분포', dist_now: '지금 분포', dist_after: '옮긴 뒤 분포', goal_next: '다음: {0}', goal_now: '지금 {0}', goal_mass: '질량 {0} / {1}', owned_n: '구매 {0}/{1}', dust_lbl: '별가루', total_mass: '총질량 {0} / {1}', tip_forge: '눈 총합은 그대로라서 평균 합은 변하지 않고, 합이 퍼지는 정도만 바뀌어요.', ev_hint: '눌러서 잡아요', nova_keep: '별핵·연구·업적은 남아요.', tip_power: '한 번 굴릴 때 붙는 질량이 늘어요.', tip_wind: '주사위를 자동으로 굴려요.', tip_dice: '주사위가 늘면 궤도가 바깥으로 늘어나요.', tip_forge2: '한 면의 눈을 같은 주사위의 다른 면으로 옮겨 합의 분포를 바꿔요.', n_bodies: '천체',
    // 초신성
    nova_btn: '초신성 일으키기', nova_need: '적색 왜성이 태어나면 열려요', nova_gain: '별핵 +{0}', nova_next: '총질량이 {0}에 닿으면 별핵 +1',
    research: '연구', challenges: '관측 과제', br0: '성장', br1: '굴림', br2: '하늘',
    chal_start: '시작하기', chal_quit: '포기하기', chal_done: '모두 완료', chal_stage: '{0}/{1}단계', chal_lock_col: '중력 붕괴 뒤에 열려요', goal_orb: '궤도 {0} {1}', chal_reward: '단계마다 보상: {0}', chal_now: '지금까지: {0}', chal_active: '진행 중', chal_lock: '초신성 {1}/{0}',
    auto_nova: '자동 초신성', on: '켜짐', off: '꺼짐',
    // 붕괴
    col_btn: '중력 붕괴시키기', col_need: '중성자별이 태어나면 열려요', col_gain: '특이점 +{0}', col_warn: '별핵과 연구가 사라지고 우주가 {0}배 무거워져요',
    sres: '특이점 연구', ending_need: '관측 과제를 모두 3단계까지 끝내야 열려요', auto_col: '자동 붕괴',
    // 기록
    ach: '업적', stats: '통계', ach_hidden: '???',
    st_time: '플레이 시간', st_rolls: '굴림', st_manual: '손 굴림', st_aligns: '정렬', st_events: '잡은 이벤트', st_best: '가장 큰 천체', st_hit: '가장 무거운 한 번', st_rare: '가장 높은 희소도', st_novas: '초신성', st_cols: '중력 붕괴', st_cores: '모은 별핵', st_sing: '모은 특이점', st_dust: '모은 별가루', st_fast: '가장 빠른 초신성',
    // 설정
    set_title: '설정', set_sfx: '효과음', set_bgm: '배경음', set_mute: '소리', set_notation: '숫자 표기', set_reduce: '연출 줄이기', set_lang: '언어',
    not_ko: '만·억·조', not_en: 'K·M·B', not_sci: '1.2e9', not_eng: '12e9',
    set_save: '저장', b_save: '저장하기', b_export: '내보내기', b_import: '가져오기', b_close: '닫기', b_credits: '크레딧 보기', b_reset: '처음부터 하기', b_title: '시작 화면으로 가기',
    saved: '저장했어요', exported: '저장 코드를 복사했어요', import_ok: '불러왔어요', import_bad: '저장 코드가 올바르지 않아요', import_prompt: '저장 코드를 붙여 넣어 주세요',
    // 복귀
    away_title: '자리를 비운 사이', away_time: '{0} 동안', away_dust: '별가루 +{0}', away_rolls: '굴림 {0}번', away_tiers: '천체 성장 {0}번', away_novas: '초신성 {0}번 · 붕괴 {1}번', away_eff: '자리 비움 효율 {0}%', b_ok: '받기',
    // 이벤트
    ev_comet: '혜성', ev_shower: '유성우', ev_flare: '태양 플레어', ev_rogue: '떠돌이 주사위', ev_align: '행성 정렬', ev_pulsar: '펄서 신호', ev_meteor: '성간 운석', ev_moons: '쌍둥이 달',
    evr_comet: '별가루 +{0}', evr_shower: '다음 {0}번 굴림 질량 ×3', evr_flare: '{0}초 동안 생산 ×4', evr_rogue: '{0}초 동안 주사위 +1', evr_align: '다음 {0}번은 정렬', evr_pulsar: '{0}초 동안 자동 굴림 ×3', evr_meteor: '궤도 {0} 질량 +{1}', evr_moons: '다음 {0}번 굴림은 양옆 궤도도 키워요',
    // 궤도 정보
    orb: '궤도 {0}', orb_empty: '아직 비어 있어요', orb_dead: '지금 주사위로는 나오지 않아요', mass: '질량', prod: '생산', chance: '확률', next_tier: '다음 단계',
    align_pop: '정렬!', tier_up: '{0} 탄생', jack_align: '정렬 ×{0}', jack_rare: '드문 합 ×{0}', move_pop: '옮기기 +{0}',
    fate: '운명', fate_title: '운명 굴림', tip_fate: '굴려서 나온 합의 궤도에 큰 질량이 붙어요. 드문 합일수록 커요.', tip_fate2: '자동 굴림이 굴릴수록 차올라요 · 최대 {0}번', fate_pop: '운명!',
    pair_or: '또는', pair_taken: '이번 판 선택: {0}', tip_pair: '둘 중 하나만 살 수 있어요. 초신성 뒤 다시 고를 수 있어요.',
    harmony: '조화 ×{0}', buff_flare: '플레어', buff_pulsar: '펄서', buff_rogue: '주사위 +1', buff_shower: '유성우 {0}번', buff_align: '정렬 {0}번', buff_moons: '달 {0}번', n_rolls: '{0}번', sum_lbl: '합',
    // 연출 문구
    nova_title: '초신성', col_title: '중력 붕괴', new_unlock: '새로 열렸어요',
    unlock_upg: '개량 탭이 열렸어요', unlock_dice: '주사위 탭이 열렸어요', unlock_nova: '초신성 탭이 열렸어요', unlock_col: '붕괴 탭이 열렸어요', unlock_chal: '관측 과제가 열렸어요',
    chal_clear: '관측 과제 완료', ach_get: '업적',
    // 엔딩
    end1: '모든 궤도가 한 줄로 섰어요.', end2: '주사위가 잠시 멈췄어요.', end3: '천구가 완성됐어요.', end_thanks: '플레이해 주셔서 고마워요.', b_continue: '계속하기',
    // 크레딧
    credits: '크레딧', cr_game: '주사위 성계', cr_made: '기획·그림·소리·코드', cr_made2: '1인 개발 (Claude와 함께)', cr_font: '글꼴', cr_font2: '갈무리 (Galmuri) · 이민서 · SIL OFL 1.1', cr_pal: '팔레트', cr_pal2: 'Fantasy 24 (Lospec)', cr_sound: '소리', cr_sound2: '코드로 합성', cr_tool: '도구', cr_tool2: 'HTML5 Canvas · Web Audio',
    save_locked: '다른 창에서 실행 중이에요', save_locked2: '이 창은 저장하지 않아요', save_fail: '저장하지 못했어요', export_title: '저장 코드', col_confirm_keep: '특이점 {0}개를 얻어요. 별핵·별핵 정제는 처음으로 돌아가고 연구는 남아요.', col_warn_keep: '별핵이 사라지고 우주가 {0}배 무거워져요', pick_die: '바꿀 주사위의 면을 고르세요',
    save_locked_q: '다른 창에서 더 최근에 저장했어요. 어느 쪽 진행을 남길까요?', b_take_over: '이 창으로 저장하기', b_reload: '다시 불러오기', import_confirm: '가져오면 지금 진행이 저장 코드의 진행으로 바뀌어요.', chal_goal_t: '목표 {0}',
    layer_bonus: '층 진행 보너스 ×{0} (층 50분에 최대)',
    refine: '별핵 정제', compress: '특이점 압축', b_refine: '정제하기', b_compress: '압축하기',
    sound_on: '소리 켜짐', sound_off: '소리 꺼짐', upg_next: '다음 개량: 이번 판 별가루 {0}', nova_confirm: '별핵 {0}개를 얻고 이번 판을 처음부터 다시 시작해요. 별핵·연구·업적은 남아요.', col_confirm: '특이점 {0}개를 얻어요. 별핵·연구·별핵 정제가 처음으로 돌아가요.', tip_align: '모든 주사위 눈이 같으면 정렬이에요. 그 굴림의 질량이 크게 늘어요.', tip_rarity: '자주 안 나오는 합일수록 한 번에 붙는 질량이 커요.', tip_harmony: '천체가 많고 단계가 높을수록 모든 생산이 늘어요.', tip_dust: '별가루', ev_appear: '하늘에 {0}', n_rolls2: '{0}번 굴림', save_broken: '저장을 불러오지 못했어요', save_broken2: '원본은 따로 보관해 두었어요', away_cap: '최대 {0}시간까지 쌓여요', fullscreen: '전체 화면', chal_confirm_start: '과제를 시작하면 이번 판이 처음부터 다시 시작돼요.', chal_confirm_quit: '과제를 포기하면 이번 판이 처음부터 다시 시작돼요.', b_start_chal: '시작하기', b_quit_chal: '포기하기', roller_s: '자동 굴림 간격',
    h_orbit_rule: '합 = 궤도',
    b_open1: '하나 열기', b_open_all: '모두 열기', box_sum: '상자 {0}개 · 새 주사위 {1}종', box_dust: '별이 가득 찬 주사위 몫 별가루 +{0}', tag_new: '새로', skip_hint: '누르면 바로 보여요',
    layer_pct: '특이점 획득 {0}%', tip_layer: '지난 붕괴 뒤로 오래 키울수록 늘어요. 40%에서 시작해 50분이 지나면 100%예요.',
    shape_d4: '정렬이 잘 나와요 · 정렬 질량 +35%', shape_d6: '기본 주사위', shape_d8: '바깥 궤도까지 · 드문 궤도 질량 증가', shape_d12: '굴림 질량 ×1.5 · 쟁반 칸을 많이 써요',
    shape_now: '지금', shape_then: '바꾸면', shape_mass: '굴림 질량', shape_orb: '궤도', shape_al: '정렬 확률', shape_prod: '생산', shape_full: '쟁반 칸이 모자라요 ({0}/{1})', shape_cur: '{0}번 칸 지금 모양', shape_pick: '{0}번 칸 모양 바꾸기',
    cur_core: '별핵', cur_sing: '특이점', cur_box: '상자', tip_core: '초신성을 일으키면 얻어요. 초신성 탭의 연구에 써요.', tip_sing: '중력 붕괴로 얻어요. 붕괴 탭의 특이점 연구에 써요.', tip_box: '눌러서 주사위 탭으로 가요.',
    // 관측 의뢰
    con_wait: '다음 의뢰까지 {0}초', con_lock: '자동 굴림을 사면 열려요', con_orbit: '궤도 {0}에 {1}', con_align: '정렬 {0}번', con_event: '하늘 이벤트 잡기', con_dust: '별가루 {0} 모으기', con_left: '{0}초', con_reward: '보상: 주사위 상자', con_reward2: '보상: 주사위 상자, 운명 굴림', b_reroll: '다른 의뢰 받기', con_ok: '의뢰 성공!', con_fail: '의뢰 시간이 끝났어요', con_new: '새 의뢰', con_none: '지금 맞는 의뢰가 없어요', tip_con: '시간 안에 끝내면 주사위 상자를 받아요.',
    // 주사위 보관함
    box: '주사위 상자', box_n: '상자 {0}개', b_open: '상자 열기', box_none: '의뢰를 끝내면 상자를 받아요', box_odds: '보통 60% · 드묾 28% · 귀함 10% · 전설 2%', rar0: '보통', rar1: '드묾', rar2: '귀함', rar3: '전설',
    new_die: '새 주사위!', star_up: '별 {0}개', dup_dust: '별이 가득 차서 별가루 +{0}', b_auto: '좋은 순서로 끼우기', slot_empty: '빈 칸', coll_title: '보관함 {0}/{1}', b_equip: '끼우기', b_unequip: '빼기', pick_slot: '끼울 칸을 누르세요', equipped_in: '{0}번 칸에 있어요', not_owned: '아직 없어요', tray_slots: '쟁반 칸', plain_die: '보통 주사위', b_box_close: '받기',
    // 도감·일지
    rec_ach: '업적', rec_dex: '도감', rec_log: '일지', rec_stats: '통계', dex_title: '천체 도감 {0}/30', dex_cls0: '뜨거운', dex_cls1: '온화한', dex_cls2: '차가운', dex_new: '새 천체 기록', dex_bonus: '생산 +{0}%', dex_unknown: '아직 못 봤어요', dex_where0: '가운데 궤도 · 희소도 2 미만', dex_where1: '중간 궤도', dex_where2: '바깥 궤도 · 희소도 4 이상', log_empty: '아직 기록이 없어요',
    spk_kwan: '한 관장', spk_do: '정비공 도담', spk_seo: '기록원 서하',
  };
  var EN = {
    title_sub: 'DICE ORRERY',
    m_continue: 'Continue', m_new: 'New game', m_settings: 'Settings', m_credits: 'Credits', m_confirmNew: 'Start over? Your current save will be erased.', m_yes: 'Erase and start', m_no: 'Back',
    tab_machine: 'Rig', tab_upg: 'Parts', tab_dice: 'Dice', tab_nova: 'Nova', tab_col: 'Void', tab_rec: 'Log',
    roll: 'Roll', per_sec: '/s',
    power: 'Roll mass', wind: 'Auto roller', dice: 'Dice count', forge: 'Requests',
    b_power: 'Upgrade', b_wind: 'Speed up', b_dice: 'Add', b_forge: 'Go move', b_buy: 'Buy', b_research: 'Research',
    power_eff: 'Per roll ×{0}', wind_none: 'Rolls by hand only', wind_eff: 'Rolls every {0}s', wind_max: 'Top speed',
    dice_eff: 'Orbits {0}-{1}', dice_max: 'Tray is full', forge_eff: 'Move a pip to another face', forge_lock: 'Opens at 3 dice',
    lv: 'Lv {0}', n_dice: '{0}', n_forge: '{0} moves left',
    dist: 'Sum odds', recent: 'Recent', rarity: 'Rarity',
    upg_hidden: 'Gather more to reveal', bought: 'Owned',
    pick_face: 'Pick a face to take a pip from', pick_to: 'Pick a face to put it on', face_max: 'This face is full', face_min: 'This face is empty', moves_left: '{0} moves left', no_moves: 'No moves left', tip_moves: '+{0} each time a new body stage appears this run', b_cancel: 'Cancel',
    shape_title: 'Die shapes', tray_cap: 'Tray {0}/{1}', change_shape: 'Swap',
    std_dist: 'Original', dist_now: 'Now', dist_after: 'After the move', goal_next: 'Next: {0}', goal_now: 'now {0}', goal_mass: 'mass {0} / {1}', owned_n: 'Owned {0}/{1}', dust_lbl: 'Stardust', total_mass: 'Total mass {0} / {1}', tip_forge: 'The pip total stays the same, so the average sum never moves. Only the spread changes.', ev_hint: 'Click to catch', nova_keep: 'Cores, research and feats stay.', tip_power: 'More mass per roll.', tip_wind: 'The roller rolls dice for you.', tip_dice: 'More dice push the orbits outward.', tip_forge2: 'Move a pip to another face of the same die to reshape the sums.', n_bodies: 'Bodies',
    nova_btn: 'Go supernova', nova_need: 'Needs a red dwarf', nova_gain: 'Cores +{0}', nova_next: 'Next core at mass {0}',
    research: 'Research', challenges: 'Trials', br0: 'Growth', br1: 'Rolling', br2: 'Sky',
    chal_start: 'Start', chal_quit: 'Give up', chal_done: 'All done', chal_stage: 'Stage {0}/{1}', chal_lock_col: 'Opens after a collapse', goal_orb: 'Orbit {0} {1}', chal_reward: 'Per stage: {0}', chal_now: 'So far: {0}', chal_active: 'Active', chal_lock: 'Novas {1}/{0}',
    auto_nova: 'Auto nova', on: 'On', off: 'Off',
    col_btn: 'Collapse', col_need: 'Needs a neutron star', col_gain: 'Singularity +{0}', col_warn: 'Cores and research are lost. The universe gets {0}× heavier',
    sres: 'Singularity research', ending_need: 'Bring every trial to stage 3 first', auto_col: 'Auto collapse',
    ach: 'Feats', stats: 'Stats', ach_hidden: '???',
    st_time: 'Play time', st_rolls: 'Rolls', st_manual: 'Hand rolls', st_aligns: 'Alignments', st_events: 'Events caught', st_best: 'Largest body', st_hit: 'Heaviest roll', st_rare: 'Rarest orbit', st_novas: 'Supernovae', st_cols: 'Collapses', st_cores: 'Cores gathered', st_sing: 'Singularities', st_dust: 'Stardust gathered', st_fast: 'Fastest nova',
    set_title: 'Settings', set_sfx: 'Effects', set_bgm: 'Music', set_mute: 'Sound', set_notation: 'Numbers', set_reduce: 'Reduce effects', set_lang: 'Language',
    not_ko: 'Korean', not_en: 'K·M·B', not_sci: '1.2e9', not_eng: '12e9',
    set_save: 'Save', b_save: 'Save', b_export: 'Export', b_import: 'Import', b_close: 'Close', b_credits: 'Credits', b_reset: 'Start over', b_title: 'Title',
    saved: 'Saved', exported: 'Save code copied', import_ok: 'Loaded', import_bad: 'That save code is not valid', import_prompt: 'Paste your save code',
    away_title: 'While you were away', away_time: 'For {0}', away_dust: 'Stardust +{0}', away_rolls: '{0} rolls', away_tiers: '{0} bodies grew', away_novas: '{0} novas · {1} collapses', away_eff: 'Away rate {0}%', b_ok: 'Collect',
    ev_comet: 'Comet', ev_shower: 'Meteor shower', ev_flare: 'Solar flare', ev_rogue: 'Rogue die', ev_align: 'Planet parade', ev_pulsar: 'Pulsar signal', ev_meteor: 'Interstellar rock', ev_moons: 'Twin moons',
    evr_comet: 'Stardust +{0}', evr_shower: 'Next {0} rolls mass ×3', evr_flare: 'Output ×4 for {0}s', evr_rogue: '+1 die for {0}s', evr_align: 'Next {0} rolls align', evr_pulsar: 'Roller ×3 for {0}s', evr_meteor: 'Orbit {0} mass +{1}', evr_moons: 'Next {0} rolls also hit neighbors',
    orb: 'Orbit {0}', orb_empty: 'Still empty', orb_dead: 'Your dice cannot roll this sum now', mass: 'Mass', prod: 'Output', chance: 'Odds', next_tier: 'Next stage',
    align_pop: 'Aligned!', tier_up: '{0} born', jack_align: 'Aligned ×{0}', jack_rare: 'Rare sum ×{0}', move_pop: 'Moves +{0}',
    fate: 'Fate', fate_title: 'Fate roll', tip_fate: 'The orbit you roll gains a large chunk of mass. Rarer sums gain more.', tip_fate2: 'Fills as the roller rolls · holds up to {0}', fate_pop: 'Fate!',
    pair_or: 'or', pair_taken: 'This run: {0}', tip_pair: 'Only one of the two. Pick again after a supernova.',
    harmony: 'Harmony ×{0}', buff_flare: 'Flare', buff_pulsar: 'Pulsar', buff_rogue: 'Rogue', buff_shower: 'Shower {0}', buff_align: 'Parade {0}', buff_moons: 'Moons {0}', n_rolls: '×{0}', sum_lbl: 'Sum',
    nova_title: 'Supernova', col_title: 'Collapse', new_unlock: 'Unlocked',
    unlock_upg: 'Parts tab unlocked', unlock_dice: 'Dice tab unlocked', unlock_nova: 'Nova tab unlocked', unlock_col: 'Collapse tab unlocked', unlock_chal: 'Trials unlocked',
    chal_clear: 'Trial complete', ach_get: 'Feat',
    end1: 'Every orbit stands in one line.', end2: 'The dice rest for a while.', end3: 'The orrery is complete.', end_thanks: 'Thank you for playing.', b_continue: 'Keep playing',
    credits: 'Credits', cr_game: 'Dice Orrery', cr_made: 'Design · Art · Sound · Code', cr_made2: 'Solo developer (with Claude)', cr_font: 'Font', cr_font2: 'Galmuri · Lee Minseo · SIL OFL 1.1', cr_pal: 'Palette', cr_pal2: 'Fantasy 24 (Lospec)', cr_sound: 'Sound', cr_sound2: 'Synthesized in code', cr_tool: 'Tools', cr_tool2: 'HTML5 Canvas · Web Audio',
    save_locked: 'Running in another window', save_locked2: 'This window will not save', save_fail: 'Could not save', export_title: 'Save code', col_confirm_keep: 'Gain {0} singularities. Cores and refining reset, research stays.', col_warn_keep: 'Cores are lost. The universe gets {0}× heavier', pick_die: 'Pick a face of the die to swap',
    save_locked_q: 'Another window saved more recently. Which progress do you keep?', b_take_over: 'Keep this one', b_reload: 'Reload', import_confirm: 'Importing replaces your current progress.', chal_goal_t: 'Goal {0}',
    layer_bonus: 'Layer progress ×{0} (max at 50 min)',
    refine: 'Core refining', compress: 'Compression', b_refine: 'Refine', b_compress: 'Compress',
    sound_on: 'Sound on', sound_off: 'Sound off', upg_next: 'Next part at {0} stardust this run', nova_confirm: 'Gain {0} cores and restart this run. Cores, research and feats stay.', col_confirm: 'Gain {0} singularities. Cores, research and refining reset.', tip_align: 'All dice show the same face: an alignment. That roll gains much more mass.', tip_rarity: 'Rarer sums add more mass per hit.', tip_harmony: 'Output grows with the total stage of all bodies.', tip_dust: 'Stardust', ev_appear: '{0} passing by', n_rolls2: '{0} rolls', save_broken: 'Could not load the save', save_broken2: 'The original was kept aside', away_cap: 'Stores up to {0}h', fullscreen: 'Fullscreen', chal_confirm_start: 'Starting a trial restarts this run.', chal_confirm_quit: 'Giving up restarts this run.', b_start_chal: 'Start', b_quit_chal: 'Give up', roller_s: 'Roll gap',
    h_orbit_rule: 'Sum = orbit',
    b_open1: 'Open one', b_open_all: 'Open all', box_sum: '{0} boxes · {1} new dice', box_dust: 'Stardust from full dice +{0}', tag_new: 'New', skip_hint: 'Click to skip',
    layer_pct: 'Singularity gain {0}%', tip_layer: 'Grows the longer you build after the last collapse. Starts at 40%, full at 50 minutes.',
    shape_d4: 'Aligns often · alignment mass +35%', shape_d6: 'Standard die', shape_d8: 'Reaches farther orbits · rare orbits gain more', shape_d12: 'Roll mass ×1.5 · takes many tray slots',
    shape_now: 'Now', shape_then: 'After', shape_mass: 'Roll mass', shape_orb: 'Orbits', shape_al: 'Align odds', shape_prod: 'Output', shape_full: 'Not enough tray slots ({0}/{1})', shape_cur: 'Slot {0} shape', shape_pick: 'Change slot {0} shape',
    cur_core: 'Cores', cur_sing: 'Singularity', cur_box: 'Boxes', tip_core: 'Earned by supernova. Spend on research in the Nova tab.', tip_sing: 'Earned by collapse. Spend on research in the Void tab.', tip_box: 'Click to open the Dice tab.',
    con_wait: 'Next request in {0}s', con_lock: 'Opens with the auto roller', con_orbit: '{1} on orbit {0}', con_align: '{0} alignments', con_event: 'Catch a sky event', con_dust: 'Gather {0} stardust', con_left: '{0}s', con_reward: 'Reward: dice box', con_reward2: 'Reward: dice box, fate roll', b_reroll: 'Another one', con_ok: 'Request done!', con_fail: 'Request timed out', con_new: 'New request', con_none: 'Nothing fits right now', tip_con: 'Finish in time to get a dice box.',
    box: 'Dice box', box_n: '{0} boxes', b_open: 'Open box', box_none: 'Finish requests to get boxes', box_odds: 'Common 60% · Uncommon 28% · Rare 10% · Legend 2%', rar0: 'Common', rar1: 'Uncommon', rar2: 'Rare', rar3: 'Legend',
    new_die: 'New die!', star_up: '{0} stars', dup_dust: 'Stars full, stardust +{0}', b_auto: 'Best fit', slot_empty: 'Empty', coll_title: 'Collection {0}/{1}', b_equip: 'Equip', b_unequip: 'Remove', pick_slot: 'Click a slot', equipped_in: 'In slot {0}', not_owned: 'Not found yet', tray_slots: 'Tray slots', plain_die: 'Plain die', b_box_close: 'Take it',
    rec_ach: 'Feats', rec_dex: 'Catalog', rec_log: 'Journal', rec_stats: 'Stats', dex_title: 'Catalog {0}/30', dex_cls0: 'Hot', dex_cls1: 'Mild', dex_cls2: 'Cold', dex_new: 'New catalog entry', dex_bonus: 'Output +{0}%', dex_unknown: 'Not seen yet', dex_where0: 'Middle orbits · rarity under 2', dex_where1: 'In-between orbits', dex_where2: 'Outer orbits · rarity 4+', log_empty: 'Nothing written yet',
    spk_kwan: 'Director Han', spk_do: 'Dodam, mechanic', spk_seo: 'Seoha, archivist',
  };
  // 이름표: [ko, en, 효과 ko, 효과 en]
  var N = {
    tiers: [['', ''], ['먼지 구름', 'Dust cloud'], ['미행성', 'Planetesimal'], ['암석 행성', 'Rocky planet'], ['바다 행성', 'Ocean world'], ['고리 행성', 'Ringed planet'], ['가스 거성', 'Gas giant'], ['갈색 왜성', 'Brown dwarf'], ['적색 왜성', 'Red dwarf'], ['백색 왜성', 'White dwarf'], ['중성자별', 'Neutron star']],
    up: {
      lens1: ['생산 렌즈 1', 'Output Lens 1'], heavy: ['정렬 질량 추 1', 'Alignment Weight 1'], felt: ['자동 굴림 톱니 1', 'Roller Gear 1'], harm1: ['조화 현 1', 'Harmony String 1'],
      reson: ['이웃 궤도 공명기 1', 'Neighbor Resonator 1'], net: ['이벤트 보상 그물', 'Event Reward Net'], lens2: ['생산 렌즈 2', 'Output Lens 2'], scope: ['드문 궤도 망원경 1', 'Rare Orbit Scope 1'],
      hand: ['굴림 질량 쟁반', 'Roll Mass Tray'], grav: ['단계 배율 추 1', 'Stage Bonus Weight 1'], twin: ['한 번 더 굴림 쟁반 1', 'Reroll Tray 1'], debris: ['단계 상승 보너스 회수기', 'Stage-up Collector'],
      lens3: ['생산 렌즈 3', 'Output Lens 3'], alres: ['정렬 확산 고리', 'Alignment Spread Ring'], gear2: ['자동 굴림 톱니 2', 'Roller Gear 2'], harm2: ['조화 현 2', 'Harmony String 2'],
      outer: ['바깥 궤도 렌즈', 'Outer Orbit Lens'], inner: ['안쪽 궤도 렌즈', 'Inner Orbit Lens'], lens4: ['생산 렌즈 4', 'Output Lens 4'], press: ['단계 문턱 압축기 1', 'Threshold Press 1'],
      heavy2: ['정렬 질량 추 2', 'Alignment Weight 2'], reson2: ['이웃 궤도 공명기 2', 'Neighbor Resonator 2'], lens5: ['생산 렌즈 5', 'Output Lens 5'], scope2: ['드문 궤도 망원경 2', 'Rare Orbit Scope 2'],
      gear3: ['자동 굴림 톱니 3', 'Roller Gear 3'], grav2: ['단계 배율 추 2', 'Stage Bonus Weight 2'], harm3: ['조화 현 3', 'Harmony String 3'], twin2: ['한 번 더 굴림 쟁반 2', 'Reroll Tray 2'],
      lens6: ['생산 렌즈 6', 'Output Lens 6'], press2: ['단계 문턱 압축기 2', 'Threshold Press 2']
    },
    res: {
      g1: ['천체 질량 연구', 'Body Mass Study'], g2: ['조화 연구', 'Harmony Study'], g3: ['시작 미행성 연구', 'Starting Planetesimals'], g4: ['별핵 질량 연구', 'Core Mass Study'], g5: ['단계 배율 연구', 'Stage Bonus Study'], g6: ['도감 보너스 연구', 'Catalog Bonus Study'],
      r1: ['시작 자동 굴림 연구', 'Starting Roller'], r2: ['시작 주사위 연구', 'Starting Dice'], r3: ['자동 굴림 간격 연구', 'Roller Gap Study'], r4: ['운명 충전 연구', 'Fate Charge Study'], r5: ['정렬 배율 연구', 'Alignment Study'], r6: ['한 번 더 굴림 연구', 'Reroll Study'],
      s1: ['이벤트 빈도 연구', 'Event Frequency Study'], s2: ['이벤트 자동 잡기', 'Auto Event Catch'], s3: ['자리 비움 효율 연구', 'Away Rate Study'], s4: ['개량 자동 구매', 'Auto Part Buying'], s5: ['기계 자동 구매', 'Auto Rig Buying'], s6: ['초신성 자동화', 'Auto Supernova']
    },
    chal: {
      c1: ['손 굴림 없는 관측', 'No-Hands Trial', '손 굴림·운명 굴림 금지', 'No hand or fate rolls'], c2: ['주사위 2개 관측', 'Two-Dice Trial', '주사위 2개 고정', 'Two dice only'], c3: ['홀수 궤도 관측', 'Odd Orbit Trial', '짝수 궤도는 생산 없음', 'Even orbits produce nothing'],
      c4: ['조화 없는 관측', 'No-Harmony Trial', '조화 없음', 'No harmony'], c5: ['느린 굴림 관측', 'Slow Roller Trial', '자동 굴림 간격 3초 고정', 'Roller fixed at 3s'], c6: ['무거운 문턱 관측', 'Heavy Threshold Trial', '단계 문턱 ×10', 'Stage thresholds ×10']
    },
    sres: {
      q1: ['별핵 획득 증폭 1', 'Core Gain Amp 1'], q2: ['천체 질량 증폭', 'Body Mass Amp'], q3: ['d4 주사위 주형', 'd4 Die Mold'], q4: ['연구 유지 장치', 'Research Keeper'], q5: ['d8 주사위 주형', 'd8 Die Mold'], q6: ['주사위 6번째 칸', 'Sixth Die Slot'],
      q7: ['자리 비움 72시간', 'Away Cap 72h'], q8: ['d12 주사위 주형', 'd12 Die Mold'], q9: ['별핵 획득 증폭 2', 'Core Gain Amp 2'], q10: ['단계 배율 증폭', 'Stage Bonus Amp'], q11: ['중력 붕괴 자동화', 'Auto Collapse'], q12: ['천구 완성 장치', 'Orrery Completion']
    },
    sp: {
      copper: ['구리 주사위', 'Copper die'], ivory: ['상아 태엽 주사위', 'Ivory clockwork die'], obsid: ['흑요석 주사위', 'Obsidian die'], coral: ['산호 주사위', 'Coral die'], lapis: ['청금석 주사위', 'Lapis die'], hour: ['모래시계 주사위', 'Hourglass die'],
      glass: ['유리 주사위', 'Glass die'], silver: ['은 주사위', 'Silver die'], amber: ['호박 주사위', 'Amber die'], meteor: ['운석 주사위', 'Meteorite die'], pearl: ['진주 주사위', 'Pearl die'],
      gold: ['금 주사위', 'Gold die'], starglass: ['별유리 주사위', 'Starglass die'], comet: ['혜성 주사위', 'Comet die'], nebula: ['성운 주사위', 'Nebula die'], hole: ['블랙홀 주사위', 'Black hole die']
    },
    ach: {
      roll1: ['첫 굴림', 'First Roll', '주사위를 굴려요', 'Roll the dice'], roll100: ['손에 익다', 'Getting the Feel', '100번 굴려요', 'Roll 100 times'], roll1k: ['쟁반 장인', 'Tray Hand', '1,000번 굴려요', 'Roll 1,000 times'],
      roll10k: ['닳은 모서리', 'Worn Edges', '1만 번 굴려요', 'Roll 10,000 times'], roll1m: ['백만 번의 소리', 'A Million Clicks', '100만 번 굴려요', 'Roll 1,000,000 times'],
      align1: ['첫 정렬', 'First Alignment', '모든 눈을 맞춰요', 'Match every die'], align50: ['정렬 수집가', 'Alignment Collector', '50번 정렬해요', 'Align 50 times'],
      align4: ['네 개의 거울', 'Four Mirrors', '주사위 4개로 정렬해요', 'Align with 4 dice'], align6: ['여섯 개의 거울', 'Six Mirrors', '주사위 6개로 정렬해요', 'Align with 6 dice'],
      tier2: ['뭉친 먼지', 'Clumped Dust', '미행성을 만들어요', 'Form a planetesimal'], tier4: ['푸른 점', 'Blue Dot', '바다 행성을 만들어요', 'Form an ocean world'], tier6: ['거대한 띠', 'Great Bands', '가스 거성을 만들어요', 'Form a gas giant'],
      tier8: ['두 번째 해', 'A Second Sun', '적색 왜성을 만들어요', 'Ignite a red dwarf'], tier9: ['식은 불씨', 'Cooled Ember', '백색 왜성을 만들어요', 'Form a white dwarf'], tier10: ['맥박', 'Pulse', '중성자별을 만들어요', 'Form a neutron star'],
      dice3: ['세 번째 눈', 'Third Eye', '주사위 3개', 'Own 3 dice'], dice5: ['한 줌', 'A Handful', '주사위 5개', 'Own 5 dice'], dice6: ['가득 찬 쟁반', 'Full Tray', '주사위 6개', 'Own 6 dice'],
      box1: ['첫 상자', 'First Box', '주사위 상자를 열어요', 'Open a dice box'], star5: ['다섯 별', 'Five Stars', '특수 주사위 하나를 5성으로', 'Raise a die to 5 stars'], legend: ['전설', 'Legend', '전설 주사위를 얻어요', 'Find a legendary die'],
      con10: ['단골 관측원', 'Regular', '의뢰 10번 성공', 'Finish 10 requests'], con50: ['천문대의 기둥', 'Pillar of the Observatory', '의뢰 50번 성공', 'Finish 50 requests'], dex15: ['도감 절반', 'Half the Catalog', '도감 15종', '15 catalog entries'], dex30: ['완성된 도감', 'Full Catalog', '도감 30종', 'All 30 entries'],
      dust6: ['한 줌의 별', 'Handful of Stars', '별가루 100만', '1M stardust'], dust12: ['은하수', 'Milky Way', '별가루 1조', '1T stardust'], dust24: ['셀 수 없는', 'Uncountable', '별가루 1e24', '1e24 stardust'], dust48: ['숫자의 끝', 'End of Numbers', '별가루 1e48', '1e48 stardust'],
      ev1: ['하늘을 본 사람', 'Sky Watcher', '이벤트를 잡아요', 'Catch an event'], ev25: ['천체 사냥꾼', 'Sky Hunter', '이벤트 25번', 'Catch 25 events'], evAll: ['모든 하늘', 'Every Sky', '이벤트 8종을 모두 잡아요', 'Catch all 8 events'],
      nova1: ['첫 폭발', 'First Blast', '초신성을 일으켜요', 'Go supernova'], nova10: ['연쇄', 'Chain Reaction', '초신성 10번', '10 supernovae'], nova50: ['불꽃놀이', 'Fireworks', '초신성 50번', '50 supernovae'],
      chal1: ['첫 관측', 'First Trial', '관측 과제를 끝내요', 'Finish a trial'], chalAll: ['관측 일지', 'Observation Log', '모든 관측 과제 3단계', 'Every trial to stage 3'],
      col1: ['지평선 너머', 'Beyond the Horizon', '중력 붕괴', 'Collapse'], col5: ['다섯 번의 밤', 'Five Nights', '중력 붕괴 5번', '5 collapses'],
      resAll: ['완성된 연구', 'Full Research', '별핵 연구 18개', 'All 18 research'], harm5: ['화음', 'Chord', '조화 ×5', 'Harmony ×5'], bodies20: ['붐비는 하늘', 'Crowded Sky', '천체 20개', '20 bodies at once'],
      rare50: ['드문 손님', 'Rare Guest', '희소도 50 이상 궤도에 맞혀요', 'Hit an orbit with rarity 50+'], streak5: ['같은 자리', 'Same Spot', '같은 합 5번 연속', 'Same sum 5 times in a row'], ending: ['천구', 'The Orrery', '엔딩을 봐요', 'See the ending']
    },
    hiddenAch: { streak5: 1, rare50: 1, ending: 1 }
  };
  // 효과 설명
  function effText(eff, v, lang) {
    var ko = lang !== 'en';
    switch (eff) {
      case 'prod': return (ko ? '생산 ×' : 'Output ×') + v;
      case 'mass': return (ko ? '질량 ×' : 'Mass ×') + v;
      case 'align': return (ko ? '정렬 배율 ×' : 'Alignment ×') + v;
      case 'interval': return (ko ? '자동 굴림 간격 ×' : 'Roller interval ×') + v;
      case 'harmony': return (ko ? '천체 단계 하나마다 조화 +' : 'Harmony per body stage +') + Math.round(v * 1000) / 10 + '%';
      case 'neighbor': return (ko ? '번호가 하나 차이 나는 궤도에 천체가 있으면 생산 +' : 'Output per adjacent-number orbit +') + Math.round(v * 100) + '%';
      case 'event': return ko ? '하늘 이벤트 효과 ×2, 더 자주' : 'Sky events ×2, more often';
      case 'rarity': return ko ? '드문 궤도가 더 크게 자라요' : 'Rare orbits grow even more';
      case 'manual': return (ko ? '손 굴림 배율 +' : 'Hand roll bonus +') + v;
      case 'tierMult': return (ko ? '단계 배율 +' : 'Stage bonus +') + v;
      case 'twin': return ko ? Math.round(v * 100) + '% 확률로 한 번 더 굴림' : Math.round(v * 100) + '% chance to roll again';
      case 'debris': return ko ? '단계가 오를 때 ' + v + '초치 생산' : v + 's of output on each stage-up';
      case 'alignSpread': return ko ? '정렬 질량이 양옆 궤도에 ' + Math.round(v * 100) + '%' : 'Alignments spill ' + Math.round(v * 100) + '% to neighbors';
      case 'outerLens': return ko ? '희소도 4 이상 궤도 생산 ×' + v : 'Orbits with rarity 4+ output ×' + v;
      case 'innerLens': return ko ? '희소도 2 미만 궤도 생산 ×' + v : 'Orbits with rarity under 2 output ×' + v;
      case 'threshold': return (ko ? '단계 문턱 ×' : 'Stage thresholds ×') + v;
      case 'startTier': return ko ? '시작할 때 모든 궤도에 미행성' : 'Start with planetesimals on every orbit';
      case 'coreMass': return ko ? '모은 별핵이 많을수록 질량이 커져요' : 'More cores gathered, more mass';
      case 'overflow': return ko ? '한 면에 눈을 9개까지 모을 수 있어요' : 'Up to 9 pips on a face';
      case 'startWind': return ko ? '자동 굴림 Lv ' + v + '로 시작' : 'Start with roller Lv ' + v;
      case 'startDice': return ko ? '주사위 ' + v + '개로 시작' : 'Start with ' + v + ' dice';
      case 'moveStart': return ko ? '판 시작 옮기기 횟수 +' + v : '+' + v + ' moves at run start';
      case 'perDie': return ko ? '주사위 하나당 질량 배율 +' + v : 'Per-die mass bonus +' + v;
      case 'oddProd': return ko ? '홀수 궤도 생산 ×' + v : 'Odd orbits output ×' + v;
      case 'outerCap': return ko ? '끝 궤도 희소도 상한 ×' + v : 'Edge orbit rarity cap ×' + v;
      case 'eventFreq': return ko ? '이벤트 간격 ×' + v : 'Event gap ×' + v;
      case 'autoCatch': return ko ? '이벤트를 자동으로 잡아요' : 'Catch events automatically';
      case 'offline': return ko ? '자리 비움 효율 100%' : 'Away rate 100%';
      case 'autoUpgrade': return ko ? '개량을 자동으로 사요' : 'Buy parts automatically';
      case 'autoBuy': return ko ? '굴림 질량·자동 굴림·주사위 자동 구매' : 'Auto-buy force, roller, dice';
      case 'autoNova': return ko ? '초신성을 자동으로 일으켜요' : 'Supernova automatically';
      case 'coreX': return (ko ? '별핵 획득 ×' : 'Core gain ×') + v;
      case 'shape': return (ko ? v + ' 주사위를 쓸 수 있어요' : 'Unlocks ' + v + ' dice');
      case 'keepResearch': return ko ? '붕괴해도 별핵 연구 유지' : 'Keep research through collapse';
      case 'slot6': return ko ? '주사위 6개까지' : 'Up to 6 dice';
      case 'offlineCap': return ko ? '자리 비움 최대 ' + v + '시간' : 'Away cap ' + v + 'h';
      case 'autoCollapse': return ko ? '붕괴를 자동으로 해요' : 'Collapse automatically';
      case 'ending': return ko ? '천구를 완성해요' : 'Complete the orrery';
      case 'diceCost': return (ko ? '주사위 추가 비용 ×' : 'Dice cost ×') + v;
      case 'dexX': return ko ? '도감 한 종마다 생산 +' + Math.round(D_DEX() * v * 100) + '%' : 'Each catalog entry +' + Math.round(D_DEX() * v * 100) + '% output';
      case 'fateRate': return ko ? '운명 굴림 충전 ×' + v : 'Fate charge ×' + v;
      case 'fateMass': return ko ? '운명 굴림 질량 +' + Math.round(v * 100) + '%' : 'Fate roll mass +' + Math.round(v * 100) + '%';
      case 'harmonyX': return (ko ? '조화 +' : 'Harmony +') + Math.round(v * 100) + '%';
    }
    return eff;
  }
  function D_DEX() { return G.DATA ? G.DATA.dexPer : 0.03; }
  // 특수 주사위 효과 (v는 별을 반영한 값)
  function spText(eff, v, lang) {
    var ko = lang !== 'en', p = Math.round(v * 100);
    switch (eff) {
      case 'mass': return ko ? '굴림 질량 +' + p + '%' : 'Roll mass +' + p + '%';
      case 'interval': return ko ? '자동 굴림 간격 −' + p + '%' : 'Roller gap −' + p + '%';
      case 'align': return ko ? '정렬 질량 +' + p + '%' : 'Alignment mass +' + p + '%';
      case 'oddMass': return ko ? '홀수 합 궤도 질량 +' + p + '%' : 'Odd-sum mass +' + p + '%';
      case 'evenMass': return ko ? '짝수 합 궤도 질량 +' + p + '%' : 'Even-sum mass +' + p + '%';
      case 'fate': return ko ? '운명 굴림 충전 +' + p + '%' : 'Fate charge +' + p + '%';
      case 'rareMass': return ko ? '희소도 4 이상 궤도 질량 +' + p + '%' : 'Rarity 4+ orbit mass +' + p + '%';
      case 'topFace': return ko ? '이 주사위가 가장 큰 눈이면 질량 ×' + (Math.round((1 + v) * 10) / 10) : 'Top face on this die: mass ×' + (Math.round((1 + v) * 10) / 10);
      case 'event': return ko ? '하늘 이벤트 효과 +' + p + '%' : 'Sky event effects +' + p + '%';
      case 'threshold': return ko ? '단계 문턱 −' + p + '%' : 'Stage thresholds −' + p + '%';
      case 'harmony': return ko ? '조화 +' + p + '%' : 'Harmony +' + p + '%';
      case 'prod': return ko ? '별가루 생산 +' + p + '%' : 'Stardust output +' + p + '%';
      case 'alignFate': return ko ? '정렬하면 운명 굴림 충전 +' + p + '%' : 'Alignments charge fate +' + p + '%';
      case 'twin': return ko ? '한 번 더 굴림 확률 +' + p + '%' : 'Reroll chance +' + p + '%';
      case 'massX': return ko ? '모든 질량 ×' + (Math.round((1 + v) * 10) / 10) : 'All mass ×' + (Math.round((1 + v) * 10) / 10);
      case 'oneFace': return ko ? '이 주사위 눈이 1이면 질량 ×' + (Math.round((1 + v) * 10) / 10) : 'A 1 on this die: mass ×' + (Math.round((1 + v) * 10) / 10);
    }
    return eff;
  }
  var lang = 'ko';
  function T(key) {
    var d = lang === 'en' ? EN : KO;
    var s = d[key]; if (s === undefined) s = KO[key]; if (s === undefined) return key;
    for (var i = 1; i < arguments.length; i++) s = s.split('{' + (i - 1) + '}').join(arguments[i]);
    return s;
  }
  function nm(group, id, idx) { var e = N[group][id]; if (!e) return id; var i = (idx || 0) * 2 + (lang === 'en' ? 1 : 0); return e[i] !== undefined ? e[i] : e[0]; }
  // 과제 목표 짧게: 같은 단계끼리 묶어 "궤도 5·11 갈색 왜성"
  function goalShort(g) {
    var by = {}, order = [];
    g.forEach(function (q) { if (!by[q[1]]) { by[q[1]] = []; order.push(q[1]); } by[q[1]].push(q[0]); });
    return order.map(function (t) { return T('goal_orb', by[t].join('·'), nm('tiers', t)); }).join(', ');
  }
  G.goalShort = goalShort;
  G.T = T; G.NAMES = N; G.nm = nm; G.effText = function (eff, v) { return effText(eff, v, lang); }; G.spText = function (eff, v) { return spText(eff, v, lang); };
  G.setLang = function (l) { lang = l; }; G.getLang = function () { return lang; };
  G.TEXT_KO = KO; G.TEXT_EN = EN;
})();
