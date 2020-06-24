const fetch = require('node-fetch');
const inactivos = require('./conceptos-inactivos.json');
const jsonfile = require('jsonfile')

console.log(inactivos.length)

async function main() {
    const replaced = [];
    for (const concept of inactivos) {
        const { razon, replace } = await getMembers(concept.conceptId);

        const t = {
            frecuencia: concept.total,
            conceptId: concept.conceptId,
            term: concept.fsn,
            razon: razon.pt.term,
            replace_id: replace && replace.conceptId,
            replace_term: replace && replace.pt.term,
        }

        replaced.push(t);
    }
    jsonfile.writeFileSync('conceptos-para-reemplazar.json', replaced, { spaces: 4 });
}
main()

async function getMembers(id) {
    const response = await fetch('http://172.16.80.80:8080/browser/MAIN/ODONTO/NEUQUEN/members?active=true&referencedComponentId=' + id, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    const { items } = response;

    const razonItem = items.find(refset => refset.refsetId === '900000000000489007');
    const replaceItem = items.find(refset => refset.refsetId === '900000000000527005' || refset.refsetId === '900000000000526001');

    let replaceConcept, razonConcept;
    if (razonItem) {
        const razonId = razonItem.additionalFields.valueId;
        razonConcept = await getConcept(razonId);
    }

    if (replaceItem) {
        const replaceId = replaceItem.additionalFields.targetComponentId;
        replaceConcept = await getConcept(replaceId);

    }
    return { razon: razonConcept, replace: replaceConcept };

}


const cacheConceptos = {};
async function getConcept(id) {
    if (cacheConceptos[id]) {
        return cacheConceptos[id];
    }

    const concepto = await fetch('http://172.16.80.80:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/' + id, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    cacheConceptos[id] = concepto;
    return concepto;
}

