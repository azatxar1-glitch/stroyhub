import { About } from "@/components/kamtehnostroy/about";
import { Advantages } from "@/components/kamtehnostroy/advantages";
import { CaseStudy } from "@/components/kamtehnostroy/case-study";
import { Cta } from "@/components/kamtehnostroy/cta";
import { Directions } from "@/components/kamtehnostroy/directions";
import { Gallery } from "@/components/kamtehnostroy/gallery";
import { Hero } from "@/components/kamtehnostroy/hero";
import { Process } from "@/components/kamtehnostroy/process";
import { Projects } from "@/components/kamtehnostroy/projects";
import { Services } from "@/components/kamtehnostroy/services";
import { Statement } from "@/components/kamtehnostroy/statement";
import { Technology } from "@/components/kamtehnostroy/technology";

/**
 * Главная страница ООО «КАМТЕХНОСТРОЙ».
 * Порядок секций задаётся здесь; содержимое каждой — в `data/kamtehnostroy/`.
 */
export default function KamtehnostroyPage() {
  return (
    <>
      <Hero />
      <Directions />
      <About />

      <div style={{ backgroundColor: "var(--kt-paper-2)" }}>
        <Services />
      </div>

      <Projects />
      <CaseStudy />
      <Advantages />
      <Process />
      <Technology />
      <Gallery />
      <Statement />
      <Cta />
    </>
  );
}
