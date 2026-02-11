export interface GPTWQuestion {
  id: string;
  text: string;
}

export interface GPTWCategory {
  id: string;
  name: string;
  description?: string;
  questions: GPTWQuestion[];
  countsForScore: boolean;
}

export const GPTW_CATEGORIES: GPTWCategory[] = [
  {
    id: "certificacao",
    name: "Certificação",
    description: "Pergunta-chave de certificação",
    countsForScore: true,
    questions: [
      { id: "q1", text: "Levando-se tudo em conta, eu diria que este é um excelente lugar para trabalhar." },
    ],
  },
  {
    id: "credibilidade",
    name: "Credibilidade",
    description: "Lideranças e comunicação",
    countsForScore: true,
    questions: [
      { id: "q2", text: "As lideranças sabem coordenar pessoas e distribuir tarefas adequadamente." },
      { id: "q3", text: "As lideranças incentivam ideias e sugestões e as levam em consideração de forma sincera." },
      { id: "q4", text: "A comunicação é informativa e acessível." },
      { id: "q5", text: "As lideranças demonstram competência na condução de pessoas e negócios." },
    ],
  },
  {
    id: "respeito",
    name: "Respeito",
    description: "Apoio, desenvolvimento e envolvimento",
    countsForScore: true,
    questions: [
      { id: "q6", text: "As lideranças envolvem as pessoas em decisões que afetam suas atividades e seu ambiente de trabalho." },
      { id: "q7", text: "A organização me oferece treinamento ou outras formas de desenvolvimento para o meu crescimento profissional." },
      { id: "q8", text: "Temos benefícios especiais e diferenciados aqui." },
      { id: "q9", text: "Recebo apoio para meu desenvolvimento profissional." },
    ],
  },
  {
    id: "imparcialidade",
    name: "Imparcialidade",
    description: "Justiça e equidade",
    countsForScore: true,
    questions: [
      { id: "q10", text: "As promoções são dadas às pessoas que realmente mais merecem." },
      { id: "q11", text: "As lideranças evitam o favoritismo." },
      { id: "q12", text: "Acredito que a quantia que recebo como participação nos resultados da organização é justa." },
      { id: "q13", text: "As pessoas aqui são bem tratadas independentemente de sua cor ou etnia." },
      { id: "q14", text: "As pessoas aqui são bem tratadas independentemente de sua orientação sexual." },
      { id: "q15", text: "As pessoas aqui são bem tratadas independentemente de sua idade." },
      { id: "q16", text: "As pessoas aqui são bem tratadas independentemente de seu gênero." },
    ],
  },
  {
    id: "orgulho",
    name: "Orgulho",
    description: "Significado e vínculo",
    countsForScore: true,
    questions: [
      { id: "q17", text: "Quando vejo o que fazemos por aqui, sinto orgulho." },
      { id: "q18", text: "Tenho orgulho de contar a outras pessoas que trabalho aqui." },
      { id: "q19", text: "Meu trabalho tem um sentido especial para mim, não é só \"mais um emprego\"." },
      { id: "q20", text: "Pretendo trabalhar aqui por muito tempo." },
      { id: "q21", text: "Eu me sinto bem com a forma pela qual contribuímos para a comunidade." },
    ],
  },
  {
    id: "camaradagem",
    name: "Camaradagem",
    description: "Ambiente e colaboração",
    countsForScore: true,
    questions: [
      { id: "q22", text: "Este é um lugar amistoso para trabalhar." },
      { id: "q23", text: "Existe um sentimento de \"família\" ou de \"equipe\" por aqui." },
      { id: "q24", text: "Pode-se contar com a colaboração das pessoas por aqui." },
      { id: "q25", text: "Nós sempre comemoramos eventos especiais." },
      { id: "q26", text: "Sinto que estamos todos \"no mesmo barco\"." },
    ],
  },
  {
    id: "adicionais",
    name: "Adicionais",
    description: "Indicadores complementares (não entram na nota)",
    countsForScore: false,
    questions: [
      { id: "q27", text: "Um compromisso assumido com um cliente torna-se prioridade para todos." },
      { id: "q28", text: "Percebo o trabalho em equipe como uma prática da empresa." },
      { id: "q29", text: "A empresa tem critérios e processos definidos para avaliação de desempenho." },
    ],
  },
];

export const LIKERT_OPTIONS = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo parcialmente" },
  { value: 3, label: "Nem concordo nem discordo" },
  { value: 4, label: "Concordo parcialmente" },
  { value: 5, label: "Concordo totalmente" },
] as const;

export const ALL_LIKERT_QUESTIONS = GPTW_CATEGORIES.flatMap((c) => c.questions);
export const TOTAL_LIKERT_QUESTIONS = ALL_LIKERT_QUESTIONS.length;
