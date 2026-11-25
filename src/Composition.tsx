import { Composition } from "remotion";
import { VideoPertama } from "./VideoPertama";
import { VideoKedua } from "./VideoKedua";
import { VideoKetiga } from "./VideoKetiga";
import { VideoFinal } from "./VideoFinal";
import { VideoChibi } from "./VideoChibi";
import { MotionSample } from "./MotionSample";
import { BajakJawa } from "./videos/bajakjawa/BajakJawa";
import { NegaraBobrok } from "./videos/negarabobrok/NegaraBobrok";

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
        id="NegaraBobrok"
        component={NegaraBobrok}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="BajakJawa"
        component={BajakJawa}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
