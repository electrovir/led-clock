import {
    insulate,
    readInsulationConfigFile,
} from 'insulation';

async function main() {
    const {modules} = await insulate(readInsulationConfigFile('./.insulation.json'), true);
    console.log(JSON.stringify(modules, null, 4));
}

main().catch(error => console.log(error));
