type RuleTarget =
  | "rule-set"
  | "surge-rule-set"
  | "stash-rule-set"
  | "loon-rule-set"
  | "shadowrocket-rule-set"
  | "surge-domain-set"
  | "surge-domain-set2"
  | "stash-domain-set"
  | "stash-domain-set2";

type ParseOptions = {
  target?: RuleTarget | string;
  include?: string[] | string | null;
  exclude?: string[] | string | null;
  noResolve?: boolean | string | number | null;
  sni?: string[] | string | null;
};

type ParsedRuleset = {
  body: string;
  rules: string[];
  unsupported: string[];
  excluded: string[];
  totalCount: number;
  domainCount: number;
  nonDomainCount: number;
};

const DOMAIN_RULE_RE = /^DOMAIN(,|-SUFFIX)/i;
const STASH_DOMAIN_RULE_RE = /^  - DOMAIN(,|-SUFFIX)/i;
const IP_RULE_RE = /^IP-CIDR6?/i;
const COMMENT_RE = /^#.+/;

export function parse(source: string, options: ParseOptions = {}): ParsedRuleset {
  const target = normalizeTarget(options.target);
  const include = normalizeList(options.include);
  const exclude = normalizeList(options.exclude);
  const sni = normalizeList(options.sni);
  const noResolve = toBoolean(options.noResolve);

  const rules: string[] = [];
  const unsupported: string[] = [];
  const excluded: string[] = [];

  for (const rawLine of splitLines(source)) {
    const normalized = normalizeLine(rawLine);
    if (!normalized) continue;

    const adjusted = applyFilterFlags(normalized, include, exclude);
    if (!adjusted) continue;

    const parsed = normalizeRule(adjusted, { noResolve, sni });
    if (!parsed) continue;

    const formatted = formatRule(parsed, target);
    if (!formatted) continue;

    if (formatted.kind === "excluded") {
      excluded.push(formatted.text);
      continue;
    }

    if (formatted.kind === "unsupported") {
      unsupported.push(formatted.text);
      continue;
    }

    rules.push(formatted.text);
  }

  const domainRules = rules.filter(
    (rule) => DOMAIN_RULE_RE.test(rule) || STASH_DOMAIN_RULE_RE.test(rule),
  );
  const nonDomainRules = rules.filter(
    (rule) => !DOMAIN_RULE_RE.test(rule) && !STASH_DOMAIN_RULE_RE.test(rule),
  );

  const totalCount = rules.length;
  const domainCount = domainRules.length;
  const nonDomainCount = nonDomainRules.length;

  const body = buildBody({
    target,
    rules,
    domainRules,
    nonDomainRules,
    unsupported,
    excluded,
    totalCount,
    domainCount,
    nonDomainCount,
  });

  return {
    body,
    rules,
    unsupported,
    excluded,
    totalCount,
    domainCount,
    nonDomainCount,
  };
}

export function stringify(value: ParsedRuleset | string): string {
  return typeof value === "string" ? value : value.body;
}

function splitLines(source: string): string[] {
  return source.replace(/\r/g, "").split("\n");
}

function normalizeTarget(target: ParseOptions["target"]): RuleTarget {
  switch (target) {
    case "stash-rule-set":
    case "loon-rule-set":
    case "shadowrocket-rule-set":
    case "surge-domain-set":
    case "surge-domain-set2":
    case "stash-domain-set":
    case "stash-domain-set2":
      return target;
    case "rule-set":
    case "surge-rule-set":
    default:
      return "surge-rule-set";
  }
}

function normalizeList(
  value: ParseOptions["include"] | ParseOptions["exclude"] | ParseOptions["sni"],
): string[] | null {
  if (value == null) return null;
  const source = Array.isArray(value) ? value : String(value).split("+");
  const list = source.map((item) => item.replace(/➕/g, "+")).filter(Boolean);
  return list.length > 0 ? list : null;
}

function toBoolean(value: ParseOptions["noResolve"]): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function normalizeLine(rawLine: string): string {
  let line = rawLine.trim();
  if (!line || line.startsWith("[")) return "";

  line = line
    .replace(/^payload:/i, "")
    .replace(/^ *(#|;|\/\/)/, "#")
    .replace(/^ *- */, "")
    .replace(/(^[^#].+)\x20+\/\/.+/, "$1")
    .replace(/(\{[0-9]+)\,([0-9]*\})/g, "$1t&zd;$2")
    .replace(/(^[^U].*(\[|=|{|\\|\/.*\.js).*)/i, "")
    .replace(/["']/g, "")
    .replace(/^(\.|\*|\+)\.?/, "DOMAIN-SUFFIX,")
    .replace(/^\[.*|^\s*$/, "");

  return line;
}

function applyFilterFlags(
  line: string,
  include: string[] | null,
  exclude: string[] | null,
): string | null {
  let next = line;

  if (include && next.startsWith("#") && include.some((item) => next.includes(item))) {
    next = next.replace(/^#/, "");
  }

  if (exclude && exclude.some((item) => next.includes(item))) {
    next = next.startsWith(";#") ? next : `;#${next.replace(/^#/, "")}`;
  }

  if (next.startsWith("#") && !next.startsWith(";#")) {
    return null;
  }

  return next;
}

function normalizeRule(
  line: string,
  options: { noResolve: boolean; sni: string[] | null },
): string | null {
  let next = line;

  if (!next.match(/^ *#/) && !next.match(/,/) && next !== "") {
    if (next.search(/[0-9]\/[0-9]/) !== -1) {
      next = `IP-CIDR,${next}`;
    } else if (next.search(/([0-9]|[a-z]):([0-9]|[a-z])/) !== -1) {
      next = `IP-CIDR6,${next}`;
    } else {
      next = `DOMAIN,${next}`;
    }
  }

  if (options.noResolve && IP_RULE_RE.test(next)) {
    next = `${next},no-resolve`;
  }

  if (options.sni && options.sni.some((item) => next.includes(item)) && !IP_RULE_RE.test(next)) {
    next = `${next},extended-matching`;
  }

  next = next
    .replace(COMMENT_RE, "")
    .replace(/^host-wildcard/i, "HO-ST-WILDCARD")
    .replace(/^host/i, "DOMAIN")
    .replace(/^dest-port/i, "DST-PORT")
    .replace(/^ip6-cidr/i, "IP-CIDR6");

  return next.replace(/t&zd;/g, ",").replace(/ ;#/g, " ").trim();
}

function formatRule(
  line: string,
  target: RuleTarget,
):
  | { kind: "rule"; text: string }
  | { kind: "excluded"; text: string }
  | { kind: "unsupported"; text: string }
  | null {
  if (!line) return null;

  const normalized = line.replace(/^HO-ST/i, "HOST");

  switch (target) {
    case "stash-rule-set": {
      if (normalized.startsWith(";#")) {
        return { kind: "excluded", text: normalized.replace(/^;#/, "").replace(/^HO-ST/i, "HOST") };
      }

      if (/^(HO-ST|U|PROTOCOL|OR|AND|NOT)/i.test(normalized)) {
        return { kind: "unsupported", text: normalized.replace(/^HO-ST/i, "HOST") };
      }

      return { kind: "rule", text: `  - ${stashRuleText(normalized)}` };
    }
    case "loon-rule-set": {
      if (normalized.startsWith(";#")) {
        return { kind: "excluded", text: normalized.replace(/^;#/, "").replace(/^HO-ST/i, "HOST") };
      }

      if (/^(HO-ST|DST-PORT|PROTOCOL|PROCESS-NAME|OR|AND|NOT)/i.test(normalized)) {
        return { kind: "unsupported", text: normalized.replace(/^HO-ST/i, "HOST") };
      }

      return { kind: "rule", text: normalized };
    }
    case "shadowrocket-rule-set":
    case "surge-rule-set":
    case "surge-domain-set":
    case "surge-domain-set2": {
      if (normalized.startsWith(";#")) {
        return { kind: "excluded", text: normalized.replace(/^;#/, "").replace(/^HO-ST/i, "HOST") };
      }

      if (/^HO-ST/i.test(normalized)) {
        return { kind: "unsupported", text: normalized.replace(/^HO-ST/i, "HOST") };
      }

      if (/^(OR|AND|NOT)/i.test(normalized)) {
        return { kind: "rule", text: normalized };
      }

      if (!normalized) return null;

      const [type, ...rest] = normalized.split(/ *, */);
      const value = rest.join(",").trim();
      const ruleType = type.toUpperCase().replace(/^PROCESS-PATH/i, "PROCESS-NAME");
      const convertedType =
        target === "surge-rule-set" ? ruleType.replace(/^DST-PORT/i, "DEST-PORT") : ruleType;
      const suffix = normalized.replace(/\x20/g, "").includes(",no-resolve") ? ",no-resolve" : "";
      const extended = normalized.replace(/\x20/g, "").includes(",extended-matching")
        ? ",extended-matching"
        : "";

      return {
        kind: "rule",
        text: `${convertedType},${value}${suffix}${extended}`.trim(),
      };
    }
    case "stash-domain-set":
    case "stash-domain-set2": {
      if (normalized.startsWith(";#")) {
        return { kind: "excluded", text: normalized.replace(/^;#/, "").replace(/^HO-ST/i, "HOST") };
      }

      if (/^HO-ST/i.test(normalized)) {
        return { kind: "unsupported", text: normalized.replace(/^HO-ST/i, "HOST") };
      }

      if (/^(OR|AND|NOT)/i.test(normalized)) {
        return { kind: "rule", text: normalized };
      }

      const [type, ...rest] = normalized.split(/ *, */);
      const value = rest.join(",").trim();
      const ruleType = type.toUpperCase().replace(/^PROCESS-PATH/i, "PROCESS-NAME");
      const suffix = normalized.replace(/\x20/g, "").includes(",no-resolve") ? ",no-resolve" : "";
      const extended = normalized.replace(/\x20/g, "").includes(",extended-matching")
        ? ",extended-matching"
        : "";

      return {
        kind: "rule",
        text: `${ruleType},${value}${suffix}${extended}`.trim(),
      };
    }
  }

  return null;
}

function stashRuleText(line: string): string {
  const [type, ...rest] = line.split(/ *, */);
  const value = rest.join(",").trim();
  const ruleType = type.toUpperCase().replace(/^PROCESS-PATH/i, "PROCESS-NAME");
  const suffix = line.replace(/\x20/g, "").includes(",no-resolve") ? ",no-resolve" : "";
  return `${ruleType},${value}${suffix}`.trim();
}

function buildBody(context: {
  target: RuleTarget;
  rules: string[];
  domainRules: string[];
  nonDomainRules: string[];
  unsupported: string[];
  excluded: string[];
  totalCount: number;
  domainCount: number;
  nonDomainCount: number;
}): string {
  const {
    target,
    rules,
    domainRules,
    nonDomainRules,
    unsupported,
    excluded,
    totalCount,
    domainCount,
    nonDomainCount,
  } = context;

  const summary = [
    `#规则数量:${totalCount}`,
    `#不支持的规则数量:${unsupported.length}`,
    `#已排除的规则数量:${excluded.length}`,
  ];

  const supportBlock = [
    unsupported.length > 0 ? `\n#不支持的规则:\n#${unsupported.join("\n#")}` : "",
    excluded.length > 0 ? `\n#已排除规则:\n#${excluded.join("\n#")}` : "",
  ].join("");

  if (target === "stash-domain-set") {
    return domainRules
      .join("\n")
      .replace(/^DOMAIN,/gm, "")
      .replace(/^DOMAIN-SUFFIX,/gm, ".");
  }

  if (target === "surge-domain-set") {
    return `${summary.join("\n")}\n#域名规则数量:${domainCount}${supportBlock}\n\n#-----------------以下为解析后的规则-----------------#\n\n${domainRules
      .join("\n")
      .replace(/^DOMAIN,/gm, "")
      .replace(/^DOMAIN-SUFFIX,/gm, ".")}`;
  }

  if (target === "surge-domain-set2") {
    return [
      `#总规则数量:${totalCount}`,
      `#非域名规则数量:${nonDomainCount}`,
      `#不支持的规则数量:${unsupported.length}`,
      `#已排除的规则数量:${excluded.length}`,
      supportBlock,
      "",
      "#-----------------以下为解析后的规则-----------------#",
      "",
      nonDomainRules.join("\n"),
    ]
      .filter((item) => item !== "")
      .join("\n");
  }

  if (target === "stash-domain-set2") {
    return [
      `#总规则数量:${totalCount}`,
      `#非域名规则数量:${nonDomainCount}`,
      `#不支持的规则数量:${unsupported.length}`,
      `#已排除的规则数量:${excluded.length}`,
      supportBlock,
      "",
      "#-----------------以下为解析后的规则-----------------#",
      "",
      "payload:",
      ...nonDomainRules.map((rule) => `  - ${rule}`),
    ]
      .filter((item) => item !== "")
      .join("\n");
  }

  if (target === "stash-rule-set") {
    return `${summary.join("\n")}${supportBlock}\n\n#-----------------以下为解析后的规则-----------------#\n\npayload:\n${rules.join("\n")}`;
  }

  return `${summary.join("\n")}${supportBlock}\n\n#-----------------以下为解析后的规则-----------------#\n\n${rules.join("\n")}`;
}
