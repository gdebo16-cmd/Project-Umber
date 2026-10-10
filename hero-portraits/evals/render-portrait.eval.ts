import { defineEval } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "mira",
      description: "A short hero brief calls render-portrait.",
      async test(t) {
        await t.send(
          "Thumbnail portrait of Mira Voss, the lantern warden: square colored-sketch bust, warm lantern light on her face, simple dark background.",
        );
        t.succeeded();
        t.calledTool("render-portrait");
      },
    },
  ],
});
