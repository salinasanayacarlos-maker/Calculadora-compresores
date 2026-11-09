
// ============================================================
// Calculadora de Compresión de Gases - FI UNAM
// Desarrollo de cálculos y validación de entradas.
// ============================================================

const $ = (id) => document.getElementById(id);
const val = (id) => Number($(id).value);
const fmt = (x, digits = 5) => Number(x).toLocaleString('es-MX', { maximumFractionDigits: digits });
const show = (id, html) => { $(id).innerHTML = html; };
const positive = (...xs) => xs.every(x => Number.isFinite(x) && x > 0);

// ---------------------- NAVEGACIÓN ----------------------

document.querySelectorAll('.tab').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
    button.classList.add('active');
    $(button.dataset.tab).classList.add('active');
  });
});

// Mostrar únicamente el exponente correspondiente al proceso.
$('process').addEventListener('change', () => {
  $('nField').classList.toggle('hidden', $('process').value !== 'poly');
  $('kField').classList.toggle('hidden', $('process').value !== 'adia');
});


// ============================================================
// 1. COMPRESIÓN BÁSICA
// ============================================================

function solveSimple() {
  const p1 = val('p1'), p2 = val('p2'), T1 = val('t1');
  const mdot = val('mdot'), R = val('rgas'), type = $('process').value;
  const exponent = type === 'poly' ? val('nexp') : (type === 'adia' ? val('kexp') : 1);
  const eta = val('etas') / 100;

  if (!positive(p1, p2, T1, mdot, R, eta) || p2 <= p1 || eta > 1 || (type !== 'iso' && exponent <= 1)) {
    show('simpleResult', '<strong>Error:</strong> verifica los datos. P₂ debe ser mayor que P₁, las magnitudes deben ser positivas, la eficiencia debe estar entre 1 y 100 % y n o k debe ser mayor que 1.');
    return;
  }

  const rp = p2 / p1;
  let wIdeal, T2, formula, substitution, processName;

  if (type === 'iso') {
    wIdeal = R * T1 * Math.log(rp);
    T2 = T1;
    formula = 'w = R·T₁·ln(P₂/P₁)';
    substitution = `w = ${fmt(R)} × ${fmt(T1)} × ln(${fmt(p2)}/${fmt(p1)}) = ${fmt(wIdeal)} kJ/kg`;
    processName = 'Isotérmico';
  } else {
    T2 = T1 * Math.pow(rp, (exponent - 1) / exponent);
    wIdeal = exponent / (exponent - 1) * R * T1 * (Math.pow(rp, (exponent - 1) / exponent) - 1);
    const symbol = type === 'poly' ? 'n' : 'k';
    formula = `wᵢd = [${symbol}/(${symbol}−1)]·R·T₁·[(P₂/P₁)^(( ${symbol}−1)/${symbol})−1]`;
    substitution = `wᵢd = [${fmt(exponent)}/(${fmt(exponent)}−1)] × ${fmt(R)} × ${fmt(T1)} × [(${fmt(rp)})^(${fmt((exponent - 1) / exponent)})−1] = ${fmt(wIdeal)} kJ/kg`;
    processName = type === 'poly' ? 'Politrópico' : 'Adiabático / isoentrópico ideal';
  }

  const wRequired = type === 'iso' ? wIdeal : wIdeal / eta;
  const power = mdot * wRequired;

  const result = `
    <div class="result-grid">
      <div class="metric"><b>Proceso</b><span>${processName}</span></div>
      <div class="metric"><b>Relación de compresión</b><span>${fmt(rp)}</span></div>
      <div class="metric"><b>Temperatura final ideal</b><span>${fmt(T2)} K</span></div>
      <div class="metric"><b>Trabajo específico ideal</b><span>${fmt(wIdeal)} kJ/kg</span></div>
      <div class="metric"><b>Trabajo específico requerido</b><span>${fmt(wRequired)} kJ/kg</span></div>
      <div class="metric"><b>Potencia requerida</b><span>${fmt(power)} kW</span></div>
    </div>
    <div class="steps"><h3>Desarrollo del cálculo</h3>
      <p><strong>1. Relación de compresión:</strong></p>
      <div class="formula">rₚ = P₂/P₁ = ${fmt(p2)}/${fmt(p1)} = ${fmt(rp)}</div>
      <p><strong>2. Trabajo específico:</strong></p>
      <div class="formula">${formula}</div>
      <div class="formula">${substitution}</div>
      ${type === 'iso' ? '' : `<p><strong>3. Temperatura final ideal:</strong></p><div class="formula">T₂ = T₁·rₚ^[(n−1)/n] = ${fmt(T1)} × ${fmt(rp)}^[(${fmt(exponent)}−1)/${fmt(exponent)}] = ${fmt(T2)} K</div>`}
      <p><strong>${type === 'iso' ? '3' : '4'}. Corrección por eficiencia y potencia:</strong></p>
      <div class="formula">w requerido = w ideal/ηₛ = ${fmt(wIdeal)}/${fmt(eta)} = ${fmt(wRequired)} kJ/kg</div>
      <div class="formula">Ẇ = ṁ·w = ${fmt(mdot)} × ${fmt(wRequired)} = ${fmt(power)} kW</div>
      <p class="muted">En el proceso isotérmico no se aplica la corrección isoentrópica ingresada; el trabajo corresponde al modelo isotérmico ideal.</p>
    </div>`;

  show('simpleResult', result);
}

function clearSimple() {
  const defaults = {
    p1: 100, p2: 500, t1: 300, mdot: 0.2,
    process: 'poly', nexp: 1.3, kexp: 1.4,
    rgas: 0.287, etas: 100
  };

  Object.entries(defaults).forEach(([id, value]) => $(id).value = value);

  $('nField').classList.remove('hidden');
  $('kField').classList.add('hidden');

  show('simpleResult', 'Ingresa los datos y selecciona “Resolver problema”.');
}

$('solveSimple').addEventListener('click', solveSimple);
$('clearSimple').addEventListener('click', clearSimple);


// ============================================================
// 2. COMPRESIÓN EN DOS ETAPAS
// ============================================================

function solveStages() {
  const p1 = val('mp1'), p2 = val('mp2'), T1 = val('mt');
  const n = val('mn'), R = val('mr'), mdot = val('mm');

  if (!positive(p1, p2, T1, n, R, mdot) || p2 <= p1 || n <= 1) {
    show('stageResult', '<strong>Error:</strong> verifica los datos; P₂ debe ser mayor que P₁ y n debe ser mayor que 1.');
    return;
  }

  const pi = Math.sqrt(p1 * p2);
  const r1 = pi / p1, r2 = p2 / pi;
  const factor = n / (n - 1) * R * T1;
  const w1 = factor * (Math.pow(r1, (n - 1) / n) - 1);
  const w2 = factor * (Math.pow(r2, (n - 1) / n) - 1);
  const wt = w1 + w2, power = mdot * wt;

  show('stageResult', `
    <div class="result-grid">
      <div class="metric"><b>Presión intermedia óptima</b><span>${fmt(pi)} kPa</span></div>
      <div class="metric"><b>Relación por etapa</b><span>${fmt(r1)}</span></div>
      <div class="metric"><b>Trabajo etapa 1</b><span>${fmt(w1)} kJ/kg</span></div>
      <div class="metric"><b>Trabajo etapa 2</b><span>${fmt(w2)} kJ/kg</span></div>
      <div class="metric"><b>Trabajo total</b><span>${fmt(wt)} kJ/kg</span></div>
      <div class="metric"><b>Potencia total</b><span>${fmt(power)} kW</span></div>
    </div>
    <div class="steps"><h3>Desarrollo del cálculo</h3>
      <p><strong>1. Presión intermedia óptima:</strong></p>
      <div class="formula">Pᵢ = √(P₁·P₂) = √(${fmt(p1)} × ${fmt(p2)}) = ${fmt(pi)} kPa</div>
      <p><strong>2. Relación de compresión por etapa:</strong></p>
      <div class="formula">r₁ = Pᵢ/P₁ = ${fmt(pi)}/${fmt(p1)} = ${fmt(r1)}; &nbsp; r₂ = P₂/Pᵢ = ${fmt(p2)}/${fmt(pi)} = ${fmt(r2)}</div>
      <p><strong>3. Trabajo de la primera etapa:</strong></p>
      <div class="formula">W₁/m = [n/(n−1)]RT₁[r₁^((n−1)/n)−1]</div>
      <div class="formula">w₁ = [${fmt(n)}/(${fmt(n)}−1)] × ${fmt(R)} × ${fmt(T1)} × [${fmt(r1)}^(${fmt((n - 1) / n)})−1] = ${fmt(w1)} kJ/kg</div>
      <p><strong>4. Trabajo de la segunda etapa:</strong></p>
      <div class="formula">w₂ = [${fmt(n)}/(${fmt(n)}−1)] × ${fmt(R)} × ${fmt(T1)} × [${fmt(r2)}^(${fmt((n - 1) / n)})−1] = ${fmt(w2)} kJ/kg</div>
      <p><strong>5. Trabajo total y potencia:</strong></p>
      <div class="formula">wₜ = w₁ + w₂ = ${fmt(w1)} + ${fmt(w2)} = ${fmt(wt)} kJ/kg</div>
      <div class="formula">Ẇ = ṁ·wₜ = ${fmt(mdot)} × ${fmt(wt)} = ${fmt(power)} kW</div>
      <p class="muted">Se considera interenfriamiento ideal, por lo que ambas etapas comienzan a T₁.</p>
    </div>`);
}

function clearStages() {
  const d = { mp1: 100, mp2: 500, mt: 300, mn: 1.3, mr: 0.287, mm: 0.2 };
  Object.entries(d).forEach(([id, value]) => $(id).value = value);
  show('stageResult', 'La presión intermedia óptima se calcula como Pᵢ = √(P₁·P₂).');
}

$('solveStages').addEventListener('click', solveStages);
$('clearStages').addEventListener('click', clearStages);


// ============================================================
// 3. COMPRESOR RECIPROCANTE
// ============================================================

function solveRecip() {
  const D = val('dcil'), S = val('stroke'), N = val('rpm');
  const p1 = val('rp1'), p2 = val('rp2'), clearance = val('clearance') / 100;
  const n = val('rn'), rod = val('rod'), T = val('rt'), MW = val('mw');
  const etaI = val('etaI') / 100, etaM = val('etaM') / 100;

  if (!positive(D, S, N, p1, p2, n, T, MW, etaI, etaM) || etaI > 1 || etaM > 1 || p2 <= p1 || n <= 1 || clearance < 0 || clearance >= 1 || rod < 0 || rod >= D) {
    show('recipResult', '<strong>Error:</strong> revisa los datos. P₂ debe ser mayor que P₁, n mayor que 1, eficiencias entre 1 y 100 %, espacio muerto entre 0 y 100 % y diámetro del vástago menor que el del cilindro.');
    return;
  }

  const rp = p2 / p1;
  const etaV = 1 + clearance - clearance * Math.pow(rp, 1 / n);

  if (etaV <= 0) {
    show('recipResult', '<strong>Error:</strong> la eficiencia volumétrica calculada es menor o igual a cero. Revisa el espacio muerto y la relación de compresión.');
    return;
  }

  const area = Math.PI * D * D / 4;
  const rodArea = Math.PI * rod * rod / 4;
  const sweptPerRev = $('effect').value === 'double' ? (area + (area - rodArea)) * S : area * S;
  const displacement = sweptPerRev * N;
  const actualFlow = displacement * etaV;
  const Ru = 8.314462618;
  const molarFlow = p1 * actualFlow / (Ru * T);
  const massFlow = molarFlow * MW;
  const wGasPerMin = n / (n - 1) * p1 * actualFlow * (Math.pow(rp, (n - 1) / n) - 1);
  const powerGas = wGasPerMin / 60;
  const indicatedPower = powerGas / etaI;
  const shaftPower = indicatedPower / etaM;

  show('recipResult', `
    <div class="result-grid">
      <div class="metric"><b>Relación de compresión</b><span>${fmt(rp)}</span></div>
      <div class="metric"><b>Eficiencia volumétrica</b><span>${fmt(etaV * 100)} %</span></div>
      <div class="metric"><b>Desplazamiento</b><span>${fmt(displacement)} m³/min</span></div>
      <div class="metric"><b>Gasto real</b><span>${fmt(actualFlow)} m³/min</span></div>
      <div class="metric"><b>Flujo másico</b><span>${fmt(massFlow)} kg/min</span></div>
      <div class="metric"><b>Potencia indicada</b><span>${fmt(indicatedPower)} kW</span></div>
      <div class="metric"><b>Potencia al eje</b><span>${fmt(shaftPower)} kW</span></div>
    </div>
    <div class="steps"><h3>Desarrollo del cálculo</h3>
      <p><strong>1. Relación de compresión:</strong></p>
      <div class="formula">rₚ = P₂/P₁ = ${fmt(p2)}/${fmt(p1)} = ${fmt(rp)}</div>
      <p><strong>2. Eficiencia volumétrica (con espacio muerto):</strong></p>
      <div class="formula">ηᵥ = 1 + C − C(rₚ)^(1/n)</div>
      <div class="formula">ηᵥ = 1 + ${fmt(clearance)} − ${fmt(clearance)}(${fmt(rp)})^(1/${fmt(n)}) = ${fmt(etaV)} = ${fmt(etaV * 100)} %</div>
      <p><strong>3. Área del pistón y volumen desplazado:</strong></p>
      <div class="formula">A = πD²/4 = π(${fmt(D)})²/4 = ${fmt(area)} m²</div>
      <div class="formula">Vdesplazado = ${$('effect').value === 'double' ? '[A + (A − Avástago)]·S·N' : 'A·S·N'} = ${fmt(displacement)} m³/min</div>
      <p><strong>4. Gasto real:</strong></p>
      <div class="formula">Qreal = Vdesplazado·ηᵥ = ${fmt(displacement)} × ${fmt(etaV)} = ${fmt(actualFlow)} m³/min</div>
      <p><strong>5. Flujo másico:</strong></p>
      <div class="formula">ṁ = (P₁·Qreal·M)/(Rᵤ·T₁) = (${fmt(p1)} × ${fmt(actualFlow)} × ${fmt(MW)})/(8.31446 × ${fmt(T)}) = ${fmt(massFlow)} kg/min</div>
      <p><strong>6. Potencia:</strong></p>
      <div class="formula">Ẇgas = [n/(n−1)]·P₁·Qreal·[(P₂/P₁)^((n−1)/n)−1] = ${fmt(wGasPerMin)} kJ/min = ${fmt(powerGas)} kW</div>
      <div class="formula">Ẇindicada = Ẇgas/ηᵢ = ${fmt(powerGas)}/${fmt(etaI)} = ${fmt(indicatedPower)} kW</div>
      <div class="formula">Ẇeje = Ẇindicada/ηₘ = ${fmt(indicatedPower)}/${fmt(etaM)} = ${fmt(shaftPower)} kW</div>
    </div>`);
}

function clearRecip() {
  const d = {
    dcil: 0.10, stroke: 0.15, rpm: 300, rp1: 100, rp2: 500,
    clearance: 5, rn: 1.3, rod: 0.015, effect: 'single',
    rt: 290, mw: 28.97, etaI: 75, etaM: 85
  };

  Object.entries(d).forEach(([id, value]) => $(id).value = value);
  show('recipResult', 'Los resultados se mostrarán con el desarrollo de las ecuaciones.');
}

$('solveRecip').addEventListener('click', solveRecip);
$('clearRecip').addEventListener('click', clearRecip);



// ============================================================
// 4. MEZCLAS DE GASES
// ============================================================

const Ru = 8.314462618; // kJ/(kmol K)

const gasLibrary = {
  CO2: { label: 'Dióxido de carbono (CO₂)', M: 44.00 },
  CO:  { label: 'Monóxido de carbono (CO)', M: 28.00 },
  N2:  { label: 'Nitrógeno (N₂)', M: 28.00 },
  O2:  { label: 'Oxígeno (O₂)', M: 32.00 },
  NH3: { label: 'Amoniaco (NH₃)', M: 17.03 },
  H2O: { label: 'Vapor de agua (H₂O)', M: 18.02 },
  CH4: { label: 'Metano (CH₄)', M: 16.04 },
  H2:  { label: 'Hidrógeno (H₂)', M: 2.016 },
  Ar:  { label: 'Argón (Ar)', M: 39.95 }
};

let components = [];
let mixCalculation = null;

// ------------------------------------------------------------
// INICIALIZACIÓN DE SELECTORES
// ------------------------------------------------------------

function fillGasSelectors() {

  const options = Object.entries(gasLibrary)
    .map(([key, gas]) =>
      `<option value="${key}">${gas.label}</option>`
    ).join('');

  $('mixGas').innerHTML = options;

  $('mixGas').value = 'CO2';

  updateMolarMass();
  renderComponents();
}

function updateMolarMass() {

  const key = $('mixGas').value;

  $('mixMW').value = gasLibrary[key].M;
}

$('mixGas').addEventListener('change', updateMolarMass);

// ------------------------------------------------------------
// AGREGAR COMPONENTES
// ------------------------------------------------------------

function addComponent() {

  const key = $('mixGas').value;
  const M = val('mixMW');
  const mass = val('mixMass');

  if (!positive(M, mass)) {

    show(
      'mixFirstResult',
      '<strong>Error:</strong> La masa molar y la masa del componente deben ser positivas.'
    );

    return;
  }

  if (components.some(c => c.key === key)) {

    show(
      'mixFirstResult',
      '<strong>Error:</strong> Ese gas ya está agregado. Elimina el componente y vuelve a agregarlo con la masa total.'
    );

    return;
  }

  components.push({
    key,
    label: gasLibrary[key].label,
    M,
    mass
  });

  renderComponents();

  $('mixMass').value = '';

  invalidateMixCalculation();
}

function renderComponents() {

  const tbody = $('mixTable').querySelector('tbody');

  const totalMoles = components.reduce(
    (sum, c) => sum + c.mass / c.M,
    0
  );

  tbody.innerHTML = components.map((c, i) => {

    const ni = c.mass / c.M;
    const yi = totalMoles > 0 ? ni / totalMoles : 0;

    return `
      <tr>
        <td>${c.label}</td>
        <td>${fmt(c.M)}</td>
        <td>${fmt(c.mass)}</td>
        <td>${fmt(ni)}</td>
        <td>${fmt(yi)}</td>
        <td>
          <button
            class="btn light small"
            data-remove-component="${i}">
            Quitar
          </button>
        </td>
      </tr>
    `;

  }).join('');

  tbody.querySelectorAll('[data-remove-component]').forEach(btn => {

    btn.addEventListener('click', () => {

      components.splice(
        Number(btn.dataset.removeComponent),
        1
      );

      renderComponents();
      invalidateMixCalculation();

    });

  });
}

// ------------------------------------------------------------
// INVALIDAR CÁLCULO CUANDO CAMBIAN LOS DATOS
// ------------------------------------------------------------

function invalidateMixCalculation() {

  mixCalculation = null;

  $('propertySection').classList.add('hidden');

  show(
    'mixFirstResult',
    'Los datos de la mezcla cambiaron. Calcula nuevamente T₂ y el trabajo.'
  );

  show(
    'mixSecondResult',
    'Selecciona el método y captura las cuatro propiedades para cada componente.'
  );
}

['mixP1', 'mixP2', 'mixT1', 'mixN'].forEach(id => {

  $(id).addEventListener('input', invalidateMixCalculation);

});

// ------------------------------------------------------------
// PRIMERA PARTE: TEMPERATURA FINAL Y TRABAJO
// ------------------------------------------------------------

function solveMixFirst() {

  const p1 = val('mixP1');
  const p2 = val('mixP2');
  const T1 = val('mixT1');
  const n = val('mixN');

  if (!positive(p1, p2, T1, n) || p2 <= p1 || n <= 1) {

    show(
      'mixFirstResult',
      '<strong>Error:</strong> P₁, P₂, T₁ y n deben ser positivos. P₂ debe ser mayor que P₁ y n debe ser mayor que 1.'
    );

    return;
  }

  if (components.length < 2) {

    show(
      'mixFirstResult',
      '<strong>Error:</strong> Agrega al menos dos componentes a la mezcla.'
    );

    return;
  }

  const totalMass = components.reduce(
    (sum, c) => sum + c.mass,
    0
  );

  const enriched = components.map(c => ({
    ...c,
    ni: c.mass / c.M
  }));

  const totalMoles = enriched.reduce(
    (sum, c) => sum + c.ni,
    0
  );

  const Mmix = totalMass / totalMoles;

  enriched.forEach(c => {
    c.y = c.ni / totalMoles;
  });

  const rp = p2 / p1;

  const T2 = T1 * Math.pow(
    rp,
    (n - 1) / n
  );

  const W = totalMass * (Ru / Mmix) *
    (T2 - T1) / (1 - n);

  mixCalculation = {
    p1,
    p2,
    T1,
    T2,
    n,
    rp,
    totalMass,
    totalMoles,
    Mmix,
    W,
    components: enriched
  };

  show('mixFirstResult', `

    <div class="result-grid">

      <div class="metric">
        <b>Temperatura final T₂</b>
        <span>${fmt(T2)} K</span>
      </div>

      <div class="metric">
        <b>Masa molar aparente</b>
        <span>${fmt(Mmix)} kg/kmol</span>
      </div>

      <div class="metric">
        <b>Moles totales</b>
        <span>${fmt(totalMoles)} kmol</span>
      </div>

      <div class="metric">
        <b>Trabajo del gas W</b>
        <span>${fmt(W)} kJ</span>
      </div>

      <div class="metric">
        <b>Trabajo de entrada</b>
        <span>${fmt(-W)} kJ</span>
      </div>

    </div>

    <div class="steps">

      <h3>Desarrollo de la primera parte</h3>

      <p><strong>1. Moles de cada componente:</strong></p>

      <div class="formula">
        nᵢ = mᵢ/Mᵢ
      </div>

      ${enriched.map(c => `
        <div class="formula">
          nᵢ (${c.label}) =
          ${fmt(c.mass)}/${fmt(c.M)} =
          ${fmt(c.ni)} kmol
        </div>
      `).join('')}

      <div class="formula">
        nₜ = Σnᵢ = ${fmt(totalMoles)} kmol
      </div>

      <p><strong>2. Masa molar aparente:</strong></p>

      <div class="formula">
        Mmezcla = mtotal/ntotal =
        ${fmt(totalMass)}/${fmt(totalMoles)} =
        ${fmt(Mmix)} kg/kmol
      </div>

      <p><strong>3. Temperatura final:</strong></p>

      <div class="formula">
        T₂ = T₁(P₂/P₁)^((n−1)/n)
      </div>

      <div class="formula">
        T₂ = ${fmt(T1)} ×
        (${fmt(p2)}/${fmt(p1)})^
        ((${fmt(n)}−1)/${fmt(n)}) =
        ${fmt(T2)} K
      </div>

      <p><strong>4. Trabajo de compresión:</strong></p>

      <div class="formula">
        W = mtotal(Ru/Mmezcla)(T₂−T₁)/(1−n)
      </div>

      <div class="formula">
        W = ${fmt(totalMass)} ×
        (8.31446/${fmt(Mmix)}) ×
        (${fmt(T2)}−${fmt(T1)})/(1−${fmt(n)})
        = ${fmt(W)} kJ
      </div>

      <p>
        Trabajo suministrado por el compresor:
        Wentrada = −W = ${fmt(-W)} kJ.
      </p>

    </div>
  `);

  buildPropertyForms();

  $('propertySection').classList.remove('hidden');

  $('propertySection').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

$('solveMixFirst').addEventListener('click', solveMixFirst);

// ------------------------------------------------------------
// CREACIÓN DE LOS CUATRO FORMULARIOS POR COMPONENTE
// ------------------------------------------------------------

function buildPropertyForms() {

  const container = $('propertyEntryContainer');

  const properties = [
    {
      id: 'u1',
      title: 'Energía interna a T₁',
      symbol: 'u₁',
      temperature: mixCalculation.T1,
      unit: 'kJ/kmol'
    },
    {
      id: 'u2',
      title: 'Energía interna a T₂',
      symbol: 'u₂',
      temperature: mixCalculation.T2,
      unit: 'kJ/kmol'
    },
    {
      id: 's1',
      title: 'Entropía estándar a T₁',
      symbol: 's₁°',
      temperature: mixCalculation.T1,
      unit: 'kJ/(kmol·K)'
    },
    {
      id: 's2',
      title: 'Entropía estándar a T₂',
      symbol: 's₂°',
      temperature: mixCalculation.T2,
      unit: 'kJ/(kmol·K)'
    }
  ];

  container.innerHTML = mixCalculation.components.map(c => {

    return `
      <div class="steps">

        <h3>${c.label}</h3>

        ${properties.map(p => `

          <div class="field">

            <label>
              ${p.title} (${p.symbol})
              <strong>Temperatura solicitada: ${fmt(p.temperature)} K</strong>
            </label>

            <select
              id="method_${c.key}_${p.id}"
              data-gas="${c.key}"
              data-property="${p.id}"
              class="property-method">

              <option value="exact">
                Introducir valor exacto de la tabla
              </option>

              <option value="interpolation">
                Realizar interpolación lineal
              </option>

            </select>

            <div
              id="inputs_${c.key}_${p.id}"
              class="grid">

              <div class="field">
                <label>Valor exacto (${p.unit})</label>
                <input
                  type="number"
                  step="any"
                  id="exact_${c.key}_${p.id}"
                  placeholder="Valor de la tabla">
              </div>

            </div>

          </div>

        `).join('')}

      </div>
    `;

  }).join('');

  // Agregar eventos a los selectores.
  container.querySelectorAll('.property-method').forEach(select => {

    select.addEventListener('change', () => {

      const key = select.dataset.gas;
      const property = select.dataset.property;

      updatePropertyInputs(key, property);

    });

  });

}

// ------------------------------------------------------------
// CAMBIAR LOS CAMPOS SEGÚN EL MÉTODO SELECCIONADO
// ------------------------------------------------------------

function updatePropertyInputs(key, property) {

  const method = $(`method_${key}_${property}`).value;

  const container = $(`inputs_${key}_${property}`);

  if (method === 'exact') {

    container.innerHTML = `

      <div class="field">

        <label>Valor exacto de la tabla</label>

        <input
          type="number"
          step="any"
          id="exact_${key}_${property}"
          placeholder="Introduce el valor tabulado">

      </div>

    `;

  } else {

    container.innerHTML = `

      <div class="field">

        <label>Temperatura inferior Tinf (K)</label>

        <input
          type="number"
          step="any"
          id="tinf_${key}_${property}"
          placeholder="Temperatura inferior">

      </div>

      <div class="field">

        <label>Valor inferior yinf</label>

        <input
          type="number"
          step="any"
          id="yinf_${key}_${property}"
          placeholder="Valor tabulado inferior">

      </div>

      <div class="field">

        <label>Temperatura superior Tsup (K)</label>

        <input
          type="number"
          step="any"
          id="tsup_${key}_${property}"
          placeholder="Temperatura superior">

      </div>

      <div class="field">

        <label>Valor superior ysup</label>

        <input
          type="number"
          step="any"
          id="ysup_${key}_${property}"
          placeholder="Valor tabulado superior">

      </div>

    `;

  }

}

// ------------------------------------------------------------
// OBTENER VALOR EXACTO O INTERPOLADO
// ------------------------------------------------------------

function getPropertyValue(key, property, targetT) {

  const method = $(`method_${key}_${property}`).value;

  // MÉTODO 1: VALOR EXACTO
  if (method === 'exact') {

    const input = $(`exact_${key}_${property}`);

    if (!input || input.value.trim() === '') {

      throw new Error(
        `Falta introducir el valor exacto de ${property} para ${gasLibrary[key].label}.`
      );

    }

    const value = Number(input.value);

    if (!Number.isFinite(value)) {

      throw new Error(
        `El valor de ${property} para ${gasLibrary[key].label} no es válido.`
      );

    }

    return {
      value,
      method: 'Valor exacto de tabla',
      detail: `${property} = ${fmt(value)}`
    };

  }

  // MÉTODO 2: INTERPOLACIÓN LINEAL

  const Tinf = Number($(`tinf_${key}_${property}`).value);
  const yinf = Number($(`yinf_${key}_${property}`).value);

  const Tsup = Number($(`tsup_${key}_${property}`).value);
  const ysup = Number($(`ysup_${key}_${property}`).value);

  if (
    ![
      Tinf,
      yinf,
      Tsup,
      ysup
    ].every(Number.isFinite)
  ) {

    throw new Error(
      `Completa los cuatro datos de interpolación para ${property} en ${gasLibrary[key].label}.`
    );

  }

  if (Tsup <= Tinf) {

    throw new Error(
      `La temperatura superior debe ser mayor que la inferior para ${property} en ${gasLibrary[key].label}.`
    );

  }

  if (targetT < Tinf || targetT > Tsup) {

    throw new Error(
      `La temperatura solicitada ${fmt(targetT)} K debe estar comprendida entre ${fmt(Tinf)} K y ${fmt(Tsup)} K para ${gasLibrary[key].label}.`
    );

  }

  // Ecuación de interpolación lineal:
  // y = yinf + [(T-Tinf)/(Tsup-Tinf)](ysup-yinf)

  const value = yinf +
    ((targetT - Tinf) / (Tsup - Tinf)) *
    (ysup - yinf);

  const detail = `
    ${property}(${fmt(targetT)} K) =
    ${fmt(yinf)} +
    [(${fmt(targetT)}−${fmt(Tinf)})/
    (${fmt(Tsup)}−${fmt(Tinf)})] ×
    (${fmt(ysup)}−${fmt(yinf)}) =
    ${fmt(value)}
  `;

  return {
    value,
    method: 'Interpolación lineal',
    detail
  };

}

// ------------------------------------------------------------
// SEGUNDA PARTE: ΔU, Q Y ΔS
// ------------------------------------------------------------

function solveMixSecond() {

  if (!mixCalculation) {

    show(
      'mixSecondResult',
      '<strong>Error:</strong> Primero debes calcular T₂ y el trabajo.'
    );

    return;
  }

  const {
    p1,
    p2,
    T1,
    T2,
    rp,
    W,
    components: enriched
  } = mixCalculation;

  let deltaU = 0;
  let deltaS = 0;

  const details = [];

  try {

    for (const c of enriched) {

      // Cuatro propiedades independientes.
      const u1 = getPropertyValue(c.key, 'u1', T1);
      const u2 = getPropertyValue(c.key, 'u2', T2);

      const s1 = getPropertyValue(c.key, 's1', T1);
      const s2 = getPropertyValue(c.key, 's2', T2);

      // Cambio de energía interna por componente.
      const du = c.ni * (u2.value - u1.value);

      // Cambio de entropía estándar.
      const dsStandard = s2.value - s1.value;

      // Corrección por cambio de presión.
      const dsPressure = -Ru * Math.log(rp);

      // Cambio total de entropía por componente.
      const ds = c.ni * (dsStandard + dsPressure);

      deltaU += du;
      deltaS += ds;

      details.push({
        c,
        u1,
        u2,
        s1,
        s2,
        du,
        dsStandard,
        dsPressure,
        ds
      });

    }

  } catch (error) {

    show(
      'mixSecondResult',
      `<strong>Error en la captura de propiedades:</strong>
      <p>${error.message}</p>`
    );

    return;

  }

  // Primera ley de la termodinámica.
  const Q = deltaU + W;

  // Desarrollo individual de cada componente.
  const propertySteps = details.map(d => `

    <h3>${d.c.label}</h3>

    <p><strong>1. Energía interna a T₁:</strong></p>

    <div class="formula">
      Método: ${d.u1.method}
    </div>

    <div class="formula">
      ${d.u1.detail}
      kJ/kmol
    </div>

    <p><strong>2. Energía interna a T₂:</strong></p>

    <div class="formula">
      Método: ${d.u2.method}
    </div>

    <div class="formula">
      ${d.u2.detail}
      kJ/kmol
    </div>

    <p><strong>3. Entropía estándar a T₁:</strong></p>

    <div class="formula">
      Método: ${d.s1.method}
    </div>

    <div class="formula">
      ${d.s1.detail}
      kJ/(kmol·K)
    </div>

    <p><strong>4. Entropía estándar a T₂:</strong></p>

    <div class="formula">
      Método: ${d.s2.method}
    </div>

    <div class="formula">
      ${d.s2.detail}
      kJ/(kmol·K)
    </div>

    <p><strong>5. Contribución a la energía interna:</strong></p>

    <div class="formula">
      ΔUᵢ = nᵢ[uᵢ(T₂)−uᵢ(T₁)]
    </div>

    <div class="formula">
      ΔUᵢ = ${fmt(d.c.ni)} ×
      (${fmt(d.u2.value)}−${fmt(d.u1.value)})
      = ${fmt(d.du)} kJ
    </div>

    <p><strong>6. Contribución a la entropía:</strong></p>

    <div class="formula">
      Δsᵢ = s°ᵢ(T₂)−s°ᵢ(T₁)−Ru ln(P₂/P₁)
    </div>

    <div class="formula">
      Δsᵢ = ${fmt(d.s2.value)}−${fmt(d.s1.value)}
      −8.31446 ln(${fmt(rp)})
      = ${fmt(d.dsStandard + d.dsPressure)}
      kJ/(kmol·K)
    </div>

    <div class="formula">
      ΔSᵢ = nᵢ × Δsᵢ =
      ${fmt(d.c.ni)} ×
      ${fmt(d.dsStandard + d.dsPressure)}
      = ${fmt(d.ds)} kJ/K
    </div>

  `).join('');

  show('mixSecondResult', `

    <div class="result-grid">

      <div class="metric">
        <b>Variación de energía interna ΔU</b>
        <span>${fmt(deltaU)} kJ</span>
      </div>

      <div class="metric">
        <b>Calor transferido Q</b>
        <span>${fmt(Q)} kJ</span>
      </div>

      <div class="metric">
        <b>Variación de entropía ΔS</b>
        <span>${fmt(deltaS)} kJ/K</span>
      </div>

    </div>

    <div class="steps">

      <h3>Desarrollo de la segunda parte</h3>

      <p><strong>1. Propiedades termodinámicas de los componentes:</strong></p>

      ${propertySteps}

      <p><strong>2. Cambio total de energía interna:</strong></p>

      <div class="formula">
        ΔU = Σ nᵢ[uᵢ(T₂)−uᵢ(T₁)]
      </div>

      <div class="formula">
        ΔU = ${details.map(d => fmt(d.du)).join(' + ')}
        = ${fmt(deltaU)} kJ
      </div>

      <p><strong>3. Calor transferido:</strong></p>

      <div class="formula">
        Q = ΔU + W
      </div>

      <div class="formula">
        Q = ${fmt(deltaU)} + (${fmt(W)})
        = ${fmt(Q)} kJ
      </div>

      <p><strong>4. Variación total de entropía:</strong></p>

      <div class="formula">
        ΔS = Σnᵢ[s°ᵢ(T₂)−s°ᵢ(T₁)−Ru ln(P₂/P₁)]
      </div>

      <div class="formula">
        ΔS = ${details.map(d => fmt(d.ds)).join(' + ')}
        = ${fmt(deltaS)} kJ/K
      </div>

      <p class="muted">
        Q positivo significa que la mezcla recibe calor.
        Q negativo significa que la mezcla cede calor a los alrededores.
        La variación de entropía corresponde al cambio de entropía del sistema.
      </p>

    </div>

  `);

}

$('solveMixSecond').addEventListener('click', solveMixSecond);

// ------------------------------------------------------------
// LIMPIAR APARTADO DE MEZCLAS
// ------------------------------------------------------------

function clearMix() {

  $('mixP1').value = 101.325;
  $('mixP2').value = 303.975;
  $('mixT1').value = 300;
  $('mixN').value = 1.25;

  components = [];
  mixCalculation = null;

  renderComponents();

  $('mixGas').value = 'CO2';
  updateMolarMass();

  $('mixMass').value = '';

  $('propertyEntryContainer').innerHTML = '';

  $('propertySection').classList.add('hidden');

  show(
    'mixFirstResult',
    'Agrega los componentes y calcula la primera parte del problema.'
  );

  show(
    'mixSecondResult',
    'Selecciona el método y captura las cuatro propiedades para cada componente.'
  );

}

$('addComponent').addEventListener('click', addComponent);
$('clearMix').addEventListener('click', clearMix);

// Inicializar la biblioteca de gases.
fillGasSelectors();
