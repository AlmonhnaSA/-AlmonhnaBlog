import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { NewsSlider } from "@/components/NewsSlider";
import HomeHero from "@/components/home/HomeHero";
import DailyStory from "@/components/home/DailyStory";
import ColumnsTrail from "@/components/home/ColumnsTrail";
import LatestArticles from "@/components/home/LatestArticles";
import CategoryMosaic from "@/components/home/CategoryMosaic";
import HomeTimelines from "@/components/home/HomeTimelines";
import WritersTrail from "@/components/home/WritersTrail";
import AskSection from "@/components/home/AskSection";
import NumberStory from "@/components/home/NumberStory";
import AudioSection from "@/components/home/AudioSection";
import Reveal from "@/components/motion/Reveal";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-clip">
      <TopBar />
      <Header />

      <main>
        <HomeHero />

        <div id="home-flow" className="editorial-home">
          <DailyStory />
         <LatestArticles />
<NumberStory />
          <AudioSection />
           <HomeTimelines />
          <ColumnsTrail />
          <CategoryMosaic />
         

          {/* خدماتنا */}
          {/* <section className="editorial-services-section py-16 md:py-24">
            <div className="container mx-auto px-6">
              <Reveal variant="clip">
                <div className="mb-8 md:mb-10 flex items-end justify-between gap-5">
                  <div>
                    <p className="editorial-kicker">نافذة أخرى</p>
                    <h2 className="editorial-heading mt-2">خدماتنا</h2>
                  </div>
                  <span className="editorial-index">٠٦</span>
                </div>
                <NewsSlider />
              </Reveal>
            </div>
          </section> */}

          <WritersTrail />
          
          <AskSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
