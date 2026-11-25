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
    </>
  );
};
