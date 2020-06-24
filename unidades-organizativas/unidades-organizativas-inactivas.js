/**
db.getCollection('organizacion').aggregate([
    { $unwind: '$unidadesOrganizativas' },
    { $group: { _id: '$unidadesOrganizativas.conceptId', concepto: {'$first': '$unidadesOrganizativas'  } } },
    { $replaceRoot : { newRoot: '$concepto' }  }
]).toArray()
 */

const jsonfile = require('jsonfile')
const fetch = require('node-fetch');
const conceptos = require('./unidades-organizativas.json');

async function main() {
    console.log('Total chunks:', conceptos.length);
    const inactive = [];
    const concepts = await getConcept(conceptos);
    concepts.filter(c => !c.active).forEach(c => {
        const conceptFind = conceptos.find(cc => cc.conceptId === c.conceptId);
        inactive.push({
            ...conceptFind
        })
    });

    console.log(inactive);
    // jsonfile.writeFileSync('conceptos-inactivos.json', inactive, { spaces: 4 })
}

main();

async function getConcept(conceptos) {
    const ids = conceptos.map(c => c.conceptId);
    return await fetch('http://172.16.80.80:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/bulk-load', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptIds: ids })
    }).then(res => res.json());

}
