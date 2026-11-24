import { MyComposition } from "./Composition";
import { HorreurV2Composition } from "./v2/HorreurV2";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <HorreurV2Composition />
    </>
  );
};
