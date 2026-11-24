import { MyComposition } from "./Composition";
import { HorreurPorteComposition } from "./porte/HorreurPorte";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <HorreurPorteComposition />
      <MyComposition />
    </>
  );
};
