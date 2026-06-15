import type { CodegenConfig } from "@graphql-codegen/cli";
const config: CodegenConfig = {
  schema: `${process.env.NEXT_PUBLIC_API_URL}/graphql`,
  documents: ["src/**/*.{ts,tsx}"],
  generates: { "./src/gql/": { preset: "client" } },
  ignoreNoDocuments: true,
};
export default config;
