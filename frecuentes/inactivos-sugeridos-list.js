const fetch = require('node-fetch');
const inactivos = require('./conceptos-inactivos.json');
const jsonfile = require('jsonfile')

console.log(inactivos.length)

async function main() {
    const replaced = [];
    for (const concept of inactivos) {
        const items = await getMembers(concept.conceptId);
        items.forEach((item) => {
            const t = {
                frecuencia: concept.total,
                conceptId: concept.conceptId,
                term: concept.fsn,
                semanticTag: concept.semanticTag,
                razon_inactivo: item.razon.pt.term,
                tipo_reemplazo: item.tipo,
                replace_id: item.replace && item.replace.conceptId,
                replace_term: item.replace && item.replace.pt.term,
            }

            replaced.push(t);
        })
    }
    jsonfile.writeFileSync('conceptos-inactivos-con-sugerencia.json', replaced, { spaces: 4 });
}
main()

async function getMembers(id) {
    const response = await fetch('http://snowtest.andes.gob.ar:8080/browser/MAIN/ODONTO/NEUQUEN/members?active=true&referencedComponentId=' + id, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    const { items, referenceSets } = response;

    const razonItem = items.find(refset => refset.refsetId === '900000000000489007');
    const replaceItems = items.filter(refset => refset.additionalFields && refset.additionalFields.targetComponentId);

    let replaceConcept, razonConcept;
    if (razonItem) {
        const razonId = razonItem.additionalFields.valueId;
        razonConcept = await getConcept(razonId);
    }
    if (replaceItems.length > 0) {
        const sugerencias = replaceItems.map(async (sug) => {
            const refset = referenceSets[sug.refsetId].pt.term.replace(/[a-záéíóú]/g, '').trim();
            const replaceId = sug.additionalFields.targetComponentId;
            replaceConcept = await getConcept(replaceId);
            return { razon: razonConcept, replace: replaceConcept, tipo: refset };
        })
        return Promise.all(sugerencias);
    } else {
        return [{ razon: razonConcept }];
    }

}


const cacheConceptos = {};
async function getConcept(id) {
    if (cacheConceptos[id]) {
        return cacheConceptos[id];
    }

    const concepto = await fetch('http://snowtest.andes.gob.ar:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/' + id, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    cacheConceptos[id] = concepto;
    return concepto;
}

