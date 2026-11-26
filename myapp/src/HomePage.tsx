import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <main className="app-main-inner home-page">
      <h1 className="home-hero__title">어디로 갈까요?</h1>
      <p className="home-hero__lead">일기와 공개 글, 두 가지 공간이 있어요.</p>

      <div className="home-cards">
        <section className="home-card card">
          <h2 className="home-card__title">마이페이지</h2>
          <p className="home-card__desc">일기를 쓰고 내 감정을 확인해요</p>
          <Link to="/mypage" className="btn btn-primary home-card__action">
            일기 쓰기
          </Link>
        </section>

        <section className="home-card card">
          <h2 className="home-card__title">커뮤니티</h2>
          <p className="home-card__desc">다른 사람의 공개 글을 읽을 수 있어요</p>
          <Link to="/community" className="btn btn-secondary home-card__action">
            게시글 둘러보기
          </Link>
        </section>
      </div>
    </main>
  )
}