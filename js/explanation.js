/* js/explanation.js（多言語対応・最小変更版）
 * - ?spotId=spot1..spot6 を判定し、写真・クイズ・解説を表示
 * - 表示時に users/{uid}/stamps/{spotId} = true を保存（匿名UID）
 * - スタンプ画像: assets/images/stamps/stampXX.png（XX=01..06）
 * - 写真: assets/images/Photos_thesis/…（ご提供ファイル名）
 * - 言語: localStorage('app_lang') = 'ja' | 'en'
 */

(function () {
  const $  = (s) => document.querySelector(s);

  // --------- 言語ユーティリティ（追加） ---------
  function getLang(){
    try { return localStorage.getItem('app_lang') || 'ja'; } catch { return 'ja'; }
  }
  function isEn(){ return getLang() === 'en'; }

  // --------- 基本ユーティリティ ---------
  function getQuery(key){
    try { return new URLSearchParams(location.search).get(key) } catch { return null }
  }
  function normalizeSpotId(v){
    const id = String(v || '').trim().toLowerCase();
    // accept spot1..spot9 for compatibility; default to spot7 (new main building id)
    return (/^spot[1-9]$/.test(id)) ? id : 'spot7';
  }
  function getSpotId(){
    const urlId = getQuery('spotId');
    const bodyId= document.body ? document.body.dataset.spot : null;
    return normalizeSpotId(urlId || bodyId || 'spot7');
  }
  function getUidSync(){
    try { return (firebase?.auth?.().currentUser?.uid) || localStorage.getItem('uid'); } catch { return null; }
  }
  function lsKey(spot){ const uid = getUidSync() || 'nouid'; return `stamp_${uid}_${spot}` }
  function toNN(spotId){ return String(spotId.replace('spot','')).padStart(2,'0') }
  function stampSrc(spotId){ return `assets/images/stamps/stamp${toNN(spotId)}.png` }

  // --------- ラベル（日/英） ---------
  const LABELS_JA = {
    spot7: '本館正面玄関',
    spot8: '図書館手前',
    spot9: 'D館記念碑',
    spot4: 'チャペル前',
    spot5: '体育館（Pec-A）前',
    spot6: '本館307前',
  };
  const LABELS_EN = {
    spot7: 'Main Building — Front Entrance',
    spot8: 'In Front of the Library',
    spot9: 'D-Building Monument',
    spot4: 'In front of the Chapel',
    spot5: 'In front of the Gymnasium (Pec-A)',
    spot6: 'In front of Main Hall 307',
  };

  // --------- 各スポットのデータ（日英） ---------
  // 画像パスは共通・テキストのみ差し替え
  const CONTENT = {
    // Spot 7: Main Building — front entrance (renamed from spot1)
    spot7: {
      // photo files are referenced here; please add actual images to assets/images/current_photos/
      mainPhoto: 'assets/images/current_photos/spot01_main.jpg',
      ja: {
        quiz: null,
        explainHTML: `
        <p>ここは本館の正面玄関だよ。大学の顔とも言える場所で、多くの式典や集合写真の舞台になってきたところです。</p>
        <figure>
          <img src="assets/images/current_photos/spot01_detail.jpg" alt="本館正面玄関の写真">
          <figcaption>写真: 本館正面（撮影予定、assets/images/current_photos/spot01_detail.jpg）</figcaption>
        </figure>
        <p>戦後の改修や増改築を経て、今の姿になっています。建物の外観や入口の意匠を観察してみてください。</p>
      `
      },
      en: {
        quiz: null,
        explainHTML: `
        <p>This is the front entrance of the Main Building. It serves as the face of the university and has been a backdrop for many ceremonies and group photos.</p>
        <figure>
          <img src="assets/images/current_photos/spot01_detail.jpg" alt="Main Building front entrance photo">
          <figcaption>Photo: Main Building front (planned file: assets/images/current_photos/spot01_detail.jpg)</figcaption>
        </figure>
        <p>The building’s appearance today reflects postwar renovations and later modifications. Take a moment to observe the façade and entrance details.</p>
      `
      }
    },

    // Spot 8: In front of the Library (renamed from spot2)
    spot8: {
      mainPhoto: 'assets/images/current_photos/spot02_main.jpg',
      ja: {
        quiz: null,
        explainHTML: `
        <p>ここは図書館の手前にある通りです。学生が行き交う場所で、図書館への入口や周辺の植栽が特徴です。</p>
        <figure>
          <img src="assets/images/current_photos/spot02_detail.jpg" alt="図書館手前の風景">
          <figcaption>写真: 図書館手前（予定ファイル: assets/images/current_photos/spot02_detail.jpg）</figcaption>
        </figure>
        <p>図書館は学びの中心です。ここでは、かつて学生たちが掲示や集会をしていた跡が見られます。</p>
      `
      },
      en: {
        quiz: null,
        explainHTML: `
        <p>This is the area in front of the library. It is a busy walkway where students pass by; notice the library entrance and surrounding plantings.</p>
        <figure>
          <img src="assets/images/current_photos/spot02_detail.jpg" alt="Area in front of the library">
          <figcaption>Photo: In front of the library (planned file: assets/images/current_photos/spot02_detail.jpg)</figcaption>
        </figure>
        <p>The library is the heart of academic life. You can still find traces of bulletin boards and gathering spots used by students in the past.</p>
      `
      }
    },

    // Spot 9: D-Building Monument (renamed from spot3)
    spot9: {
      mainPhoto: 'assets/images/current_photos/spot03_main.jpg',
      ja: {
        quiz: null,
        explainHTML: `
        <p>ここはD館前の記念碑です。卒業や歴史を記念する石碑やレリーフがあり、学生や教員による寄贈が刻まれていることがあります。</p>
        <figure>
          <img src="assets/images/current_photos/spot03_detail.jpg" alt="D館記念碑の写真">
          <figcaption>写真: D館記念碑（予定ファイル: assets/images/current_photos/spot03_detail.jpg）</figcaption>
        </figure>
        <p>記念碑に刻まれた名前や日付をよく見てみてください。キャンパスの歴史が垣間見えます。</p>
      `
      },
      en: {
        quiz: null,
        explainHTML: `
        <p>This is the monument in front of D-Building. You can find plaques and reliefs commemorating donations and graduations—sometimes bearing names of alumni and staff.</p>
        <figure>
          <img src="assets/images/current_photos/spot03_detail.jpg" alt="D-Building monument photo">
          <figcaption>Photo: D-Building monument (planned file: assets/images/current_photos/spot03_detail.jpg)</figcaption>
        </figure>
        <p>Take a close look at the inscriptions—the names and dates offer glimpses into the campus history.</p>
      `
      }
    },

    spot8: {
      mainPhoto: 'assets/images/Photos_thesis/spot2_main.jpg',
      ja: {
        quiz: {
          q: 'T館がある所には、昔何があったでしょうか？',
          choices: { A:'教会', B:'道', C:'教室棟' },
          answer: 'B'
        },
        explainHTML: `
        <p>写真を見ると、横から見たら「E」みたいになっている本館と、十字の形の理学館があって、奥に三角のシーベリーチャペルがあるよね。でも、<b>T館はどこにもない</b>のはわかるかな？ これは1970年の写真だよ。本当に何もなかったんだ！</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot2_main.jpg" alt="理学館を含むキャンパス全景">
          <figcaption>出典：『理学館を含むキャンパス全景』P-497-46-043, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>本館はずっと変わらないね。他には何が見えるか、探してみてね！</p>
      `
      },
      en: {
        quiz: {
          q: 'What used to be where T Hall stands now?',
          choices: { A:'Church', B:'Road', C:'Classroom building' },
          answer: 'B'
        },
        explainHTML: `
        <p>In the photo, you can see the E-shaped Main Hall from the side, the cross-shaped Science Hall, and the triangular Seabury Chapel in the distance. But notice that <b>T Hall is nowhere to be seen</b>. This is from 1970—there really was nothing there!</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot2_main.jpg" alt="Campus panorama including Science Hall">
          <figcaption>Source: “Campus Panorama including Science Hall,” P-497-46-043, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>The Main Hall looks the same as ever. See what else you can find!</p>
      `
      }
    },

    spot9: {
      mainPhoto: 'assets/images/Photos_thesis/spot3_main.jpg',
      ja: {
        quiz: {
          q: 'ガッキで行われていたことは何でしょう？',
          choices: { A:'結婚式', B:'オーケストラコンクール', C:'ダンスバトル' },
          answer: 'A'
        },
        explainHTML: `
        <p><b>結婚式も、結婚式の披露宴も</b>行われていたよ。写真は1955年ごろのガッキ（学生キッチンの略）。昔はICUのガッキでは、中富商事の提供するフレンチ料理を食べることが出来たんだ。結婚式のときは、豪華な本格フレンチがふるまわれたとか。</p>
        <p>中富商事は今でも本格フレンチのレストランを営んでいるよ。今目の前にあるガッキの中にある暖炉は、今は使われていないけど、現役で使われていた時代もあったんだ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot3_main.jpg" alt="1955_学生食堂全景">
          <figcaption>出典：『大学食堂　全景』P-01_04_027, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>このころのガッキからさらに改築されて、2010年に今のガッキに建て替えられる前は、こんな感じだったよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot3.jpg" alt="食堂・外観（改築前）">
          <figcaption>出典：『a.食堂・外観080415-04.JPG』 ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>今はもっと大きくなったね！</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot3_detail_1.jpg" alt="ICUフェスティバルの日の食堂">
          <figcaption>出典：『ICUフェスティバルの日の食堂』P-04_01_109, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>これは何の日のガッキかわかるかな？いろんな人がいて楽しそうだね！1950-1960年代の写真だよ。</p>
        <p>答えは、<b>ICUフェスティバルの日！</b>学祭の日ってことだね。</p>
        <!-- ▼▼ 追記分 ▼▼ -->
        <figure>
          <img src="assets/images/Photos_thesis/spot3_detail_3.jpg" alt="アメリカン・ナイト（1961年4月29日）">
          <figcaption>出典：『アメリカンナイト 1961年4月29日』P-04_01_122, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>これはガッキの写真だ。アメリカン・ナイトという、1961年4月29日に行われた催しの写真。ICUに所属するアメリカの学生が大学のために主催し、夕食と、その後にダンスが行われた。日本人に馴染みがあるようにと、西部劇スタイルで学生たちが学食に上がろうとするところを撮っている。昔はこんな風に楽しそうなイベントを行っていたんだね！そして、何気なく書かれているけど、そう、昔はガッキは朝食と夕食も提供していたんだ！今は昼のみ営業しているけど、そんな時代もあったんだね。</p>
        <!-- ▲▲ 追記ここまで ▲▲ -->
      `
      },
      en: {
        quiz: {
          q: 'What used to be held at the cafeteria (“Gakki”)?',
          choices: { A:'Wedding ceremonies', B:'Orchestra contest', C:'Dance battle' },
          answer: 'A'
        },
        explainHTML: `
        <p><b>Both wedding ceremonies and receptions</b> were held here. The photo shows the cafeteria around 1955. Back then, French cuisine provided by Nakatomi Shoji was served at ICU’s cafeteria—and at weddings, a full authentic French course was offered.</p>
        <p>Nakatomi Shoji still runs a genuine French restaurant today. The fireplace in the cafeteria you see now is no longer in use, but it was once actively used.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot3_main.jpg" alt="Cafeteria panorama, around 1955">
          <figcaption>Source: “University Cafeteria — Panorama,” P-01_04_027, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>After further renovations from this era, the building was replaced with the current cafeteria in 2010. Before that, it looked like this:</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot3.jpg" alt="Cafeteria exterior before rebuilding">
          <figcaption>Source: “a. Cafeteria / Exterior 080415-04.JPG,” ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>It’s much larger now!</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot3_detail_1.jpg" alt="Cafeteria on ICU Festival day">
          <figcaption>Source: “Cafeteria on ICU Festival Day,” P-04_01_109, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>Can you guess what day this was? It looks lively with many people! The photo is from the 1950s–60s.</p>
        <p>The answer is <b>ICU Festival day</b>—the school festival!</p>
        <!-- ▼▼ Added ▼▼ -->
        <figure>
          <img src="assets/images/Photos_thesis/spot3_detail_3.jpg" alt="American Night (April 29, 1961)">
          <figcaption>Source: “American Night, April 29, 1961,” P-04_01_122, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>This photo shows “American Night,” held on April 29, 1961. American students at ICU hosted dinner followed by a dance for the university. To feel familiar to Japanese audiences, students went up to the cafeteria in a Western-movie style. Events like this were once enjoyed here! And yes—back then the cafeteria served breakfast and dinner as well. Today it opens for lunch only.</p>
        <!-- ▲▲ Added ▲▲ -->
      `
      }
    },

    spot4: {
      mainPhoto: 'assets/images/Photos_thesis/spot4_main.jpg',
      ja: {
        quiz: {
          q: 'この写真と今のチャペルの形が違うのはなぜでしょうか？',
          choices: { A:'建築士が喧嘩して建て直したから', B:'すぐに壊れて建て直したから', C:'音響が悪くて建て直したから' },
          answer: 'C'
        },
        explainHTML: `
      <p>出典：『礼拝堂外観　ヴォーリズ設計』P-01_04_001, ICUアーカイブス 三鷹 東京</p>
        <p>ロマネスク様式の<b>バラ窓</b>が見事なチャペルだね。これは1954年にヴォーリズ建築事務所によって建てられたけど、ヴォーリズが引退した後、<b>1959年にレーモンド</b>というモダニズム建築士によって建て替えられたんだ。下は建て替え後の写真だよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot4_detail_1.jpg" alt="建て替え後の礼拝堂（1970）">
          <figcaption>出典：『コミュニティ・スクール、教会学校、ウァークキャンプ 19502-1970』P-03_44_013, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>一説にはモダニズム建築のレーモンドがロマネスク様式を嫌って建て替えた…という話もあるみたいだけど、さすがに喧嘩したぐらいで、募金を募って建てられたICUのチャペル建て直しはできないよね…。</p>
        <p><b>第二次世界大戦後の日米で、和解を願って集められた寄付によって購入されたのが、このICUが建つ三鷹の土地なんだ。</b>人々の善意によって建てられた大学に居るっていうのは、キュッと身を引き締めさせてくれるね。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot4_detail_2.jpg" alt="礼拝堂玄関前ゲスト_1955">
          <figcaption>出典：『礼拝堂　外観　玄関前　式典　外国人ゲスト』P-01_04_038, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>これは何の日の礼拝堂かな？皆きれいな格好だね！答えは結婚式の日だよ！ICUに勤められていた都留春夫（つる はるお）先生の結婚祝いに作られたアルバムに入っていた写真なんだ。</p>
        <p>都留先生は1955年にICUチャペルでヘルスセンター勤務の篠原氏と挙式されたんだよ。カウンセリングの父と呼ばれる先生で、ICUに初期からカウンセリングセンターがあるのもこの先生のおかげなんだ。この写真には写っていないけど...。</p>
        <!-- ▼▼ 追記分 ▼▼ -->
        <figure>
          <img src="assets/images/Photos_thesis/spot4_detail_3.jpg" alt="1957年 一期生卒業式（礼拝堂）">
          <figcaption>出典：『1期生　Baccalaureate Service　礼拝堂玄関　退場　学生』P-01_09_009, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>これはチャペル、礼拝堂の写真。一期生の卒業式、1957年のものだよ。玄関から一期生達が退場しているね。1957年ということは、昔の姿のチャペルの時代だね！昔チャペルの前を今人たちが通っていったんだと思うと不思議だよね。</p>
        <!-- ▲▲ 追記ここまで ▲▲ -->
      `
      },
      en: {
        quiz: {
          q: 'Why does the chapel in this photo look different from today’s chapel?',
          choices: { A:'Architects fought and rebuilt it', B:'It broke soon and was rebuilt', C:'It was rebuilt due to poor acoustics' },
          answer: 'C'
        },
        explainHTML: `
      <p>Source: “Chapel Exterior — Designed by Vories,” P-01_04_001, ICU Archives, Mitaka, Tokyo</p>
        <p>The chapel features a beautiful <b>rose window</b> in Romanesque style. It was built in 1954 by the Vories Architectural Office, but after Vories retired it was <b>rebuilt in 1959</b> by modernist architect Antonin Raymond. The photo below shows the rebuilt chapel.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot4_detail_1.jpg" alt="Chapel after rebuilding (1970)">
          <figcaption>Source: “Community School, Sunday School, Work Camp 19502–1970,” P-03_44_013, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>There is a story that Raymond, as a modernist, disliked Romanesque style and rebuilt it—but it’s hard to imagine rebuilding ICU’s chapel, which was funded through donations, just because of that.</p>
        <p><b>The land in Mitaka on which ICU stands was purchased with donations collected in Japan and the U.S. after WWII, in the hope of reconciliation.</b> Studying at a university built through people’s goodwill is humbling and inspiring.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot4_detail_2.jpg" alt="Guests at the chapel entrance, 1955">
          <figcaption>Source: “Chapel — Exterior, Entrance, Ceremony, Foreign Guests,” P-01_04_038, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>What day do you think this was? Everyone is dressed nicely! The answer: a wedding day. This photo was in an album made to celebrate the marriage of Prof. Haruo Tsuru, who worked at ICU.</p>
        <p>Prof. Tsuru married Ms. Shinohara of the Health Center at the ICU Chapel in 1955. He is known as a father of counseling in Japan, and thanks to him ICU established its counseling center early on. (He isn’t in this particular photo, though.)</p>
        <!-- ▼▼ Added ▼▼ -->
        <figure>
          <img src="assets/images/Photos_thesis/spot4_detail_3.jpg" alt="First class commencement at chapel (1957)">
          <figcaption>Source: “1st Class — Baccalaureate Service, Chapel Entrance, Students Exiting,” P-01_09_009, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>This shows the chapel during the 1957 commencement of the first class. Students are exiting the entrance. Since it was 1957, the chapel still had its earlier appearance. It’s fascinating to think people back then walked past the same front that people pass today.</p>
        <!-- ▲▲ Added ▲▲ -->
      `
      }
    },

    spot5: {
      mainPhoto: 'assets/images/Photos_thesis/spot5_main.jpg',
      ja: {
        quiz: {
          q: '体育館にはA館とB館がありますが、B館はいつごろ建てられたでしょうか？',
          choices: { A:'1990年代', B:'1970年代', C:'1950年代' },
          answer: 'B'
        },
        explainHTML: `
      <p>出典：『学生② 1950年代、1960年代 授業・クラブ活動 体育館完成 1973』P-04_02_033 ICUアーカイブス 三鷹 東京</p>
        <p><b>1973年の写真</b>だよ。B館に入ったことがある人は、このころから内装が変わっていないことが分かるね！50年も昔から、ここでいろんな学生が運動を楽しんでいるんだよ。もちろんジムで体を鍛える学生もね！</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot5_detail_1.jpg" alt="当時はプール棟もありました（1973）">
          <figcaption>出典：『学生② 1950年代、1960年代 授業・クラブ活動 体育館完成 1973』P-04_02_037, ICUアーカイブス 三鷹 東京</figcaption>
        </figure>
        <p>2018年に新しくA館が出来たよ！ 木がきれいだね。この建築には建築士の隈研吾さんが関わっているよ。その時にプール棟は無くなって、新しくなったんだ。</p>
      `
      },
      en: {
        quiz: {
          q: 'There are Gym A and Gym B. When was Gym B built?',
          choices: { A:'1990s', B:'1970s', C:'1950s' },
          answer: 'B'
        },
        explainHTML: `
      <p>Source: “Students (II) — 1950s–1960s, Classes & Clubs, Gym Completed 1973,” P-04_02_033, ICU Archives, Mitaka, Tokyo</p>
        <p>This photo is from <b>1973</b>. If you’ve been inside Gym B, you might notice the interior hasn’t changed much since then. For over 50 years, many students have enjoyed sports here—some also work out in the gym!</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot5_detail_1.jpg" alt="There used to be a pool building (1973)">
          <figcaption>Source: “Students (II) — 1950s–1960s, Classes & Clubs, Gym Completed 1973,” P-04_02_037, ICU Archives, Mitaka, Tokyo</figcaption>
        </figure>
        <p>Gym A was newly built in 2018—the wooden design is beautiful. Architect Kengo Kuma was involved. The old pool building was removed at that time.</p>
      `
      }
    },

    spot6: {
      mainPhoto: 'assets/images/Photos_thesis/spot6_main.jpg',
      ja: {
        quiz: null,
        explainHTML: `
      <p>出典：『ICU 農場 (1951-1970)』P-03_42_007 ICUアーカイブス 三鷹 東京</p>
        <p>ここまで見てくれてありがとう！最後はクイズ無しでごほうびを楽しんでね！</p>
        <p>今、本館の東側にいるよね？そこから下を見ると、階段を下りた真下に入り口があるんだ。そこから農場にトラクターで向かっている写真だよ。</p>
        <p>下に降りたらぜひ振り返って見てみてね！</p>
        <p>最後なのに解説が短いな？と思った人は、ぜひスペシャルコンテンツを見てみてね！もっとたくさんの写真が載ってるよ！</p>
      `,
        message: `
        <p>マップに戻ったらアンケートにぜひ答えてね！</p>
        <p>スペシャルコンテンツも待ってるよ〜！</p>
      `
      },
      en: {
        quiz: null,
        explainHTML: `
      <p>Source: “ICU Farm (1951–1970),” P-03_42_007, ICU Archives, Mitaka, Tokyo</p>
        <p>Thanks for exploring all the way here! Enjoy a little reward without a quiz for the finale.</p>
        <p>You’re now on the east side of the Main Hall. Looking down the stairs, there was an entrance below that led toward the farm by tractor.</p>
        <p>When you go down, try looking back!</p>
        <p>If this last explanation felt short, check out the Special Content—there are many more photos!</p>
      `,
        message: `
        <p>Back on the map, please consider answering the survey!</p>
        <p>The Special Content is waiting for you too!</p>
      `
      }
    }
  };

  // --------- 描画処理（最小変更） ---------
  function render(spotId){
    const lang = getLang();
    const title = (lang === 'en' ? LABELS_EN[spotId] : LABELS_JA[spotId]) || (lang==='en'?'Spot':'スポット');
    const confRoot  = CONTENT[spotId] || CONTENT.spot7;
    const conf      = confRoot[lang] || confRoot.ja;

    // タイトル
    $('#spotTitle').textContent = title;

    // スタンプ画像
    const sImg = $('#gotStampImage');
    if (sImg) { sImg.src = stampSrc(spotId); sImg.alt = `${title} ${lang==='en'?'stamp':'のスタンプ'}`; }

    // メイン写真
    const photo = $('#spotPhoto');
    if (photo) {
      if (confRoot.mainPhoto) {
        photo.src = confRoot.mainPhoto;
        photo.alt = `${title} ${lang==='en'?'photo':'の写真'}`;
      } else {
        photo.src = '';
        photo.alt = '';
      }
    }

    // クイズ（spot6は非表示）
    const quizSection = $('#quizSection');
    const quizBody    = $('#quizBody');
    const quizChoices = $('#quizChoices');
    const answerBlock = $('#answerBlock');
    const answerText  = $('#answerText');
    const showBtn     = $('#showAnswerBtn');
    const special     = $('#specialMessage');

    if (conf.quiz){
      quizSection.style.display = 'block';
      if (special) special.style.display = 'none';

      quizBody.innerHTML = `<p>${conf.quiz.q}</p>`;
      quizChoices.innerHTML = `
        <p>A. ${conf.quiz.choices.A}</p>
        <p>B. ${conf.quiz.choices.B}</p>
        <p>C. ${conf.quiz.choices.C}</p>
      `;
      answerBlock.style.display = 'none';
      if (showBtn) {
        showBtn.disabled = false;
        showBtn.onclick = () => {
          const label = (lang==='en' ? 'Answer' : '答え');
          answerText.innerHTML = `<b>${label}：${conf.quiz.answer}</b>（${conf.quiz.choices[conf.quiz.answer]}）`;
          answerBlock.style.display = 'block';
          showBtn.disabled = true;
        };
      }
    } else {
      // クイズ無し（spot6）
      if (quizSection) quizSection.style.display = 'none';
      if (special) {
        special.style.display = 'block';
        special.innerHTML = conf.message || '';
      }
    }

    // 解説
    const explain = $('#explainBlock');
    if (explain) explain.innerHTML = conf.explainHTML || '';

    // 画面タイトル（ブラウザ）
    try { document.title = `${title} | ${lang==='en'?'Explanation':'解説'}`; } catch {}
  }

  // --------- 保存処理（既存踏襲） ---------
  async function ensureAnon() {
    if (typeof window.ensureAnon === 'function') {
      try { const uid = await window.ensureAnon(); if (uid) return uid; } catch(e){}
    }
    try {
      if (!firebase?.apps?.length && typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
      }
      const auth = firebase.auth();
      if (auth.currentUser) return auth.currentUser.uid;
      const cred = await auth.signInAnonymously();
      return cred.user && cred.user.uid;
    } catch(e) {
      console.warn('[explanation] ensureAnon fallback failed:', e?.message||e);
      return getUidSync();
    }
  }

  async function saveStamp(spotId){
    let uid = null;
    try { uid = await ensureAnon(); } catch(e){ console.warn('[explanation] ensureAnon failed:', e) }

    // ローカル先行
    try { localStorage.setItem(lsKey(spotId), 'true'); } catch {}

    if (!uid) return;
    try {
      const db = firebase.database();
      const updates = {};
      updates[`users/${uid}/stamps/${spotId}`] = true;
      updates[`users/${uid}/meta/updatedAt`]   = Date.now();
      await db.ref().update(updates);
      console.log('[explanation] stamp saved:', uid, spotId);
    } catch(e){
      console.warn('[explanation] Firebase write failed:', e?.message || e);
    }
  }

  // --------- 起動 ---------
  // ポップアップ表示 / 非表示
  function hideStampPopup(){
    try {
      const popup = $('#stampPopup');
      if (popup) popup.classList.remove('show');
      try { document.body.classList.remove('popup-open'); } catch(e){}
    } catch(e){}
  }

  function showStampPopup(spotId){
    try {
      const popup = $('#stampPopup');
      if (!popup) return;
      const titleEl = $('#stampPopupTitle');
      const img = $('#stampPopupImage');
      const closeBtn = $('#stampPopupClose');
      const lang = getLang();

      if (titleEl) titleEl.textContent = (lang === 'en') ? 'You got a stamp!' : 'スタンプを取得しました';
      if (img) { img.src = stampSrc(spotId); img.alt = `${spotId} ${lang==='en'?'stamp':'のスタンプ'}` }

      // show popup (popup-only UX)
      popup.classList.add('show');
      try { document.body.classList.add('popup-open'); } catch(e){}

      // handlers
  if (closeBtn) closeBtn.onclick = hideStampPopup;
      popup.onclick = function(ev){ if (ev.target === popup) hideStampPopup(); };
      window.addEventListener('keydown', function onEsc(e){ if (e.key === 'Escape'){ hideStampPopup(); window.removeEventListener('keydown', onEsc); } });
    } catch(e){ console.warn('[explanation] showStampPopup error', e); }
  }
  async function boot(){
    const spotId = getSpotId();
    render(spotId);
    await saveStamp(spotId);

    // スタンプ取得ポップアップを表示（言語反映後に）
    try { showStampPopup(spotId); } catch(e){ console.warn('[explanation] popup failed', e); }

    // AR (8th Wall) 経由で戻ってきた場合にポップアップが出ないことがあるため、
    // referrer に 8thwall を含む場合や returnTo=map.html の場合は再試行する。
    try {
      const ref = (document.referrer || '').toLowerCase();
      const from8th = ref.indexOf('8thwall') !== -1 || ref.indexOf('8thwall.app') !== -1;
      const ret = getQuery('returnTo');
      if (from8th || ret === 'map.html') {
        // 少し待ってから再表示を試みる（DOM/スタイルが遅れるケース対策）
        setTimeout(()=>{
          try {
            const popup = $('#stampPopup');
            if (popup && !popup.classList.contains('show')) {
              showStampPopup(spotId);
            }
          }catch(e){}
        }, 350);
      }
    } catch(e){}

    // もし同ページで言語切替UIを載せた場合に即時反映したいときのフック
    window.addEventListener('app_lang_changed', () => render(spotId));
  }

  document.addEventListener('DOMContentLoaded', boot);
}());
