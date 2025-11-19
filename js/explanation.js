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
  // allow per-spot stamp image overrides (some spots use non-sequential stamp files)
  const STAMP_OVERRIDES = {
    // spot9 uses stamp02.png, spot8 uses stamp03.png per content spec
    spot9: 'assets/images/stamps/stamp02.png',
    spot8: 'assets/images/stamps/stamp03.png'
  };
  function stampSrc(spotId){ return STAMP_OVERRIDES[spotId] || `assets/images/stamps/stamp${toNN(spotId)}.png` }

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
    // Spot 7: Main Building — front entrance
    spot7: {
      mainPhoto: 'assets/images/Photos_thesis/spot1_detail_2.jpg',
      ja: {
        quiz: {
          q: '本館は昔何に使われていたでしょうか？',
          choices: { A:'図書館', B:'畑', C:'飛行機の制作' },
          answer: 'C'
        },
        explainHTML: `
        <p>ICUがある所には昔、「中島飛行機」という名前の会社があったんだ。戦争のころには軍用機も多く作られていたんだよ。後に「富士重工業（現社名：SUBARU）」という会社になるよ。本館はもともと中島飛行機が使っていたものを1953年に改築したんだ。これは改装前の写真だよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_detail_1.jpg" alt="改装前の本館写真">
          <figcaption>（写真: 改装前の本館、assets/images/Photos_thesis/spot1_detail_1.jpg）</figcaption>
        </figure>

        <p>これは一期生の卒業式の写真！1957年のことだよ。70年近く前の卒業生も、今と変わらない道を歩いたんだね。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_detail_2.jpg" alt="1957年の一期生卒業式の写真">
          <figcaption>（写真: 1957年 一期生卒業式、assets/images/Photos_thesis/spot1_detail_2.jpg）</figcaption>
        </figure>

        <p>これは昔の小田急バスの写真！このころは今のバス停とは違い、今本館の向かって右、東側すぐまで来ていたらしいよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_detail_3.jpg" alt="昔の小田急バスの写真">
          <figcaption>（写真: 小田急バス、assets/images/Photos_thesis/spot1_detail_3.jpg）</figcaption>
        </figure>

        <p>これは授業風景の写真……ではなく、1950-60年頃のクラブ活動の写真。本館で行われていたみたいだね。かつての人たちの生き生きとした表情がうかがえるよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot7_detail_2.jpg" alt="クラブ活動の写真">
          <figcaption>（写真: クラブ活動、assets/images/Photos_thesis/spot7_detail_2.jpg）</figcaption>
        </figure>
      `
      },
      en: {
        quiz: {
          q: 'What was the Main Building originally used for?',
          choices: { A:'A library', B:'A field', C:'Aircraft manufacturing' },
          answer: 'C'
        },
        explainHTML: `
        <p>Long before ICU was here, this site was home to a company called Nakajima Aircraft. During the war years they produced many military aircraft. The company later became Fuji Heavy Industries (now known as SUBARU). The Main Building was originally part of Nakajima Aircraft and was rebuilt in 1953. The photo below shows the building before renovation.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_detail_1.jpg" alt="Main Building before renovation">
          <figcaption>(Photo: Main Building before renovation, assets/images/Photos_thesis/spot1_detail_1.jpg)</figcaption>
        </figure>

        <p>This is a photo from the first-class commencement in 1957. Nearly 70 years ago, graduates walked the same paths people walk today.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_detail_2.jpg" alt="1957 commencement photo">
          <figcaption>(Photo: 1957 commencement, assets/images/Photos_thesis/spot1_detail_2.jpg)</figcaption>
        </figure>

        <p>Here is an old Odakyu bus photo. Back then the bus stop reached much closer to the Main Building on its east side than it does today.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_detail_3.jpg" alt="Old Odakyu bus photo">
          <figcaption>(Photo: Odakyu bus, assets/images/Photos_thesis/spot1_detail_3.jpg)</figcaption>
        </figure>

        <p>Finally, this is not a classroom photo but a club activity scene from the 1950s–60s, apparently held in the Main Building. You can sense how lively people were back then.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot7_detail_2.jpg" alt="Club activity photo">
          <figcaption>(Photo: Club activities, assets/images/Photos_thesis/spot7_detail_2.jpg)</figcaption>
        </figure>
      `
      }
    },

    // Spot 8: Library entrance
    spot8: {
      mainPhoto: 'assets/images/Photos_thesis/spot8_main.jpg',
      ja: {
        quiz: {
          q: '図書館の地下を掘った時の土はどこへ持っていかれたでしょうか？',
          choices: { A:'ICUの森', B:'バカ山・アホ山', C:'滑走路脇' },
          answer: 'B'
        },
        explainHTML: `
        <p><b>☆自転車や歩行者に注意してね！☆</b></p>
        <p>この場所からだと図書館の変遷がよくわかるね。昔の図書館の中はこんな感じだったらしいよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot8_detail_3.jpg" alt="図書館の過去の写真">
          <figcaption>（写真: 図書館の過去の様子）</figcaption>
        </figure>
        <p>1960年に寄付金をもとに左側が建てられて、1972年に右側が増築、2000年に後ろ側にグループラーニングエリアやカフェが入っているオスマー図書館（正式にはミルドレッドトップオスマー図書館）が増えたんだ。また、ICUの図書館には地下階があるけど、その地下を掘った土が盛られてできたのがバカ山とアホ山なんだよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_main.jpg" alt="1950年代の本館前の写真">
          <figcaption>（写真: 1950年代の本館前。バカ山・アホ山はまだない）</figcaption>
        </figure>
        <p>この図書館が出来る前は、本館に図書館があったんだ！本を引越ししたんだよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot8_detail_4.jpg" alt="図書館の移転に関する写真">
          <figcaption>（写真）</figcaption>
        </figure>
        <p>図書館の手前、図書館から出てきた時に右側の茂みの内側には、1952年のサンフランシスコ平和条約を記念して建てられた碑があるよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot8_detail_5.jpg" alt="図書館手前にある記念碑の写真">
          <figcaption>（写真）</figcaption>
        </figure>
        <p>これはICUが1952年に、第二次世界大戦後の日米において、和平を願って集められた寄付金によって献学されたからなんだ。</p>
        <p>ICU図書館の歴史については、ICU図書館のホームページから歴史・沿革を選ぶことで見られるよ！</p>
      `
      },
      en: {
        quiz: {
          q: 'Where was the soil taken when the library basement was excavated?',
          choices: { A:'ICU Woods', B:'Baka-yama & Aho-yama (mounds)', C:'Beside the runway' },
          answer: 'B'
        },
        explainHTML: `
        <p><b>☆Please watch for bicycles and pedestrians!☆</b></p>
        <p>From this spot you can clearly see how the library has changed over time. The interior of the old library looked something like this.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot8_detail_3.jpg" alt="Historic photo of the library">
          <figcaption>(Photo: historic view of the library)</figcaption>
        </figure>
        <p>The left wing was built in 1960 thanks to donations, the right wing was added in 1972, and in 2000 the Osmar Library (officially the Mildred Topp Osmar Library) was expanded at the rear to include group learning areas and a café. The library has a basement, and the soil dug out when creating it was piled up to form the two mounds known as Baka-yama and Aho-yama.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot1_main.jpg" alt="Main Building, 1950s">
          <figcaption>(Photo: Main Building in the 1950s — note the mounds are not yet present)</figcaption>
        </figure>
        <p>Before this library was built, the library collection was housed in the Main Building, and the books were moved when the new library opened.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot8_detail_4.jpg" alt="Photo related to the library relocation">
          <figcaption>(Photo)</figcaption>
        </figure>
        <p>On the right side of the path in front of the library, tucked inside the bushes, there is a monument erected in 1952 to commemorate the San Francisco Peace Treaty. This reflects donations made in 1952 in the hope of peace between Japan and the U.S. after World War II.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot8_detail_5.jpg" alt="Monument near the library">
          <figcaption>(Photo)</figcaption>
        </figure>
        <p>For more on the history of the ICU Library, please see the library’s official website and its history pages.</p>
      `
      }
    },

    // Spot 9: D-Building
    spot9: {
      mainPhoto: 'assets/images/Photos_thesis/spot9_main.jpg',
      ja: {
        quiz: {
          q: 'D館には昔何が入っていたでしょうか？',
          choices: { A:'理髪店', B:'服飾店', C:'青果店' },
          answer: 'A'
        },
        explainHTML: `
        <p>D館には昔、学生や教職員が暮らすための施設が入っていたんだ。コーヒーを出してくれるカウンターや、理髪店や郵便局、靴磨き店もあったんだよ！</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_6.jpg" alt="地下一階にある理髪店跡の写真">
          <figcaption>（地下一階にある理髪店跡の写真）</figcaption>
        </figure>
        <p>今でも1階の床には、カウンターがあった所に色の違うタイルが貼られているよ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_3.jpg" alt="D館の1階床タイルの写真">
          <figcaption>（写真）</figcaption>
        </figure>

        <p>D館は東側（今正面にある、記念碑があるほう）と西側（ファミリーマートが入っている方）に分かれていて、東側の方が古いよ。このD館東館の入口側・礼拝堂の裏がICUの中心だよ。この写真の、わざとかくっとなっている部分が中心をあらわしているんだ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_7.jpg" alt="D館の入口付近写真">
          <figcaption>（写真）</figcaption>
        </figure>

        <p>D館とはICU創立に多大なる貢献をしてくださった、ディッフェンドルファー博士を記念して1958年に建てられた建築だよ。D館はディッフェンドルファー博士を悼むものでもあるんだ。</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_8.jpg" alt="D館外観の写真">
          <figcaption>（写真）</figcaption>
        </figure>

        <p>登録有形文化財になっていて、3.4階にはほぼ日本最古のアルミサッシや、古くて景色が歪んで見えるガラスが使われている窓があるなど、とっても貴重な建物なんだ！</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_5.jpg" alt="D館の古いガラスの写真">
          <figcaption>（写真では分からないけどガラスが歪んでいるよ）</figcaption>
        </figure>

        <p>D館には歴史を解説するパネルがあるんだ。ここに載っていること以外の事もたくさん書いてあるから、ぜひ見てみてね！</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_4.jpg" alt="D館に設置されている歴史解説パネルの写真">
          <figcaption>（写真）</figcaption>
        </figure>
      `
      },
      en: {
        quiz: {
          q: 'What used to be located in D-Building?',
          choices: { A:'A barbershop', B:'A clothing shop', C:'A greengrocer' },
          answer: 'A'
        },
        explainHTML: `
        <p>D-Building once housed facilities used by students and staff. There was a counter serving coffee, a barbershop, a post office, and even a shoeshine stand!</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_6.jpg" alt="Remains of a barbershop in the basement">
          <figcaption>(Caption: Remains of a barbershop in the basement)</figcaption>
        </figure>
        <p>Even today you can see tiles on the first-floor floor where the counter once stood — the tiles are a different color there.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_3.jpg" alt="Tiles on the D-Building first floor">
          <figcaption>(Photo)</figcaption>
        </figure>

        <p>D-Building is split into an east side (where the monument now stands) and a west side (the side with the FamilyMart). The east side is older. The entrance side of the east wing, just behind the chapel, marks the historic center of ICU — the small kink in the building in the photo indicates that center.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_7.jpg" alt="Entrance area of D-Building">
          <figcaption>(Photo)</figcaption>
        </figure>

        <p>D-Building was constructed in 1958 to honor Dr. Diffendorfer, who made significant contributions to the founding of ICU. The building serves as a memorial to him.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_8.jpg" alt="Exterior of D-Building">
          <figcaption>(Photo)</figcaption>
        </figure>

        <p>The building is registered as a tangible cultural property. On the third and fourth floors you can find very early aluminum window frames and old glass that slightly distorts the view — features that make the building especially valuable.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_5.jpg" alt="Old glass at D-Building">
          <figcaption>(Caption: The glass is slightly warped though you may not notice in photos)</figcaption>
        </figure>

        <p>There is also an information panel explaining D-Building’s history. It contains many details beyond what’s shown here, so please take a look when you visit.</p>
        <figure>
          <img src="assets/images/Photos_thesis/spot9_detail_4.jpg" alt="History panel at D-Building">
          <figcaption>(Photo)</figcaption>
        </figure>
      `
      }
    },

    // Spot 4, 5, 6 remain unchanged (kept as before)
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
    // Prefer requested language; if not present, prefer English, then Japanese fallback
    const conf      = confRoot[lang] || confRoot.en || confRoot.ja;

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
