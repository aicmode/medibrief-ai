/** 入力例。ボタン1クリックで入力欄に流し込む。 */
export type SymptomExample = {
  id: string;
  label: string;
  text: string;
};

export const SYMPTOM_EXAMPLES: SymptomExample[] = [
  {
    id: "example-1",
    label: "例1：のど・熱",
    text: "昨日の夜から喉が痛くて、今朝から少し熱っぽい。咳は少しだけ。市販の風邪薬を飲んだ。仕事があるので悪化しないか心配。",
  },
  {
    id: "example-2",
    label: "例2：胃の不調",
    text: "3日前から胃が重い感じがある。食後に気持ち悪くなる。吐いてはいない。最近ストレスが多い。以前も似た症状があった。",
  },
  {
    id: "example-3",
    label: "例3：続く頭痛",
    text: "先週から頭痛が続いている。朝より夕方に強い。寝不足もある。痛み止めを飲むと少し楽になる。病院で何を伝えればいいかわからない。",
  },
];
