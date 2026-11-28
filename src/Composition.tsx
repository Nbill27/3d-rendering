import { Composition } from "remotion";
import { VideoPertama } from "./VideoPertama";
import { VideoKedua } from "./VideoKedua";
import { VideoKetiga } from "./VideoKetiga";
import { VideoFinal } from "./VideoFinal";
import { VideoChibi } from "./VideoChibi";
import { MotionSample } from "./MotionSample";
import { Video01 } from "./videos/v01/Video01";
import { Video02 } from "./videos/v02/Video02";
import { Video03 } from "./videos/v03/Video03";
import { Video04 } from "./videos/v04/Video04";
import { Video05 } from "./videos/v05/Video05";
import { Video06 } from "./videos/v06/Video06";
import { Video07 } from "./videos/v07/Video07";
import { Video08 } from "./videos/v08/Video08";
import { Video09 } from "./videos/v09/Video09";
import { TobaTest } from "./videos/v10/TobaTest";
import { TobaTestV2 } from "./videos/v11/TobaTestV2";
import { Video14 } from "./videos/v14/Video14";
import { Video16 } from "./videos/v16/Video16";
import { Video12 } from "./videos/v12/Video12";
import { Video17 } from "./videos/v17/Video17";
import { Video18 } from "./videos/v18/Video18";
import { Video19 } from "./videos/v19/Video19";
import { Video20 } from "./videos/v20/Video20";
import { Video21 } from "./videos/v21/Video21";
import { Video22 } from "./videos/v22/Video22";
import { Video22Fail2Install } from "./videos/v22-fail2install/Video22Fail2Install";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="VideoPertama"
        component={VideoPertama}
        durationInFrames={1680}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VideoKedua"
        component={VideoKedua}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VideoKetiga"
        component={VideoKetiga}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="VideoFinal"
        component={VideoFinal}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="VideoChibi"
        component={VideoChibi}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MotionSample"
        component={MotionSample}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video02"
        component={Video02}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video01"
        component={Video01}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video03"
        component={Video03}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video04"
        component={Video04}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video05"
        component={Video05}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video06"
        component={Video06}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video07"
        component={Video07}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video08"
        component={Video08}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video09"
        component={Video09}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video10"
        component={TobaTest}
        durationInFrames={1622}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video11"
        component={TobaTestV2}
        durationInFrames={1396}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video14"
        component={Video14}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video16"
        component={Video16}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video12"
        component={Video12}
        durationInFrames={1680}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video17"
        component={Video17}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video18"
        component={Video18}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video19"
        component={Video19}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video20"
        component={Video20}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DiBalikLayarRaceCondition"
        component={Video21}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DiBalikLayarFail2Install"
        component={Video22Fail2Install}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Video22"
        component={Video22}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
