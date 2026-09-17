#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
const rawName = args.find((arg) => !arg.startsWith('--'));
const force = args.includes('--force');
const skipRegister = args.includes('--skip-register');
const projectDir = process.cwd();

if (!rawName) {
  console.error(
    'Uso: npm run make:module -- <nome-do-modulo> [--force] [--skip-register]',
  );
  process.exit(1);
}

const srcDir = path.resolve(projectDir, 'src');

if (!fs.existsSync(srcDir)) {
  console.error(
    'Execute este comando na raiz da API, onde existe a pasta src/.',
  );
  process.exit(1);
}

const moduleName = toKebabCase(rawName);
const entityName = singularize(moduleName);
const moduleClassName = `${toPascalCase(moduleName)}Module`;
const controllerClassName = `${toPascalCase(moduleName)}Controller`;
const serviceClassName = `${toPascalCase(moduleName)}Service`;
const repositoryClassName = `${toPascalCase(moduleName)}Repository`;
const entityClassName = toPascalCase(entityName);
const entityVariableName = toCamelCase(entityName);
const collectionVariableName = toCamelCase(moduleName);
const createDtoClassName = `Create${entityClassName}Dto`;
const updateDtoClassName = `Update${entityClassName}Dto`;
const targetDir = path.join(srcDir, moduleName);
const dtosDir = path.join(targetDir, 'dtos');

const files = new Map([
  [
    path.join(dtosDir, `create-${entityName}.dto.ts`),
    `import { IsNotEmpty, IsString } from 'class-validator';

export class ${createDtoClassName} {
  @IsString()
  @IsNotEmpty()
  name: string;
}
`,
  ],
  [
    path.join(dtosDir, `update-${entityName}.dto.ts`),
    `import { IsOptional, IsString } from 'class-validator';

export class ${updateDtoClassName} {
  @IsString()
  @IsOptional()
  name?: string;
}
`,
  ],
  [
    path.join(targetDir, `${moduleName}.repository.ts`),
    `import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ${createDtoClassName} } from './dtos/create-${entityName}.dto';
import { ${updateDtoClassName} } from './dtos/update-${entityName}.dto';

type ${entityClassName}Entity = ${createDtoClassName} & {
  id: string;
};

@Injectable()
export class ${repositoryClassName} {
  private readonly ${collectionVariableName}: ${entityClassName}Entity[] = [];

  create(create${entityClassName}Dto: ${createDtoClassName}) {
    const ${entityVariableName} = {
      id: randomUUID(),
      ...create${entityClassName}Dto,
    };

    this.${collectionVariableName}.push(${entityVariableName});

    return ${entityVariableName};
  }

  findAll() {
    return this.${collectionVariableName};
  }

  findOne(id: string) {
    const ${entityVariableName} = this.${collectionVariableName}.find((${entityVariableName}) => ${entityVariableName}.id === id);

    if (!${entityVariableName}) {
      throw new NotFoundException('${entityClassName} not found');
    }

    return ${entityVariableName};
  }

  update(id: string, update${entityClassName}Dto: ${updateDtoClassName}) {
    const ${entityVariableName} = this.findOne(id);

    Object.assign(${entityVariableName}, update${entityClassName}Dto);

    return ${entityVariableName};
  }

  remove(id: string) {
    const ${entityVariableName} = this.findOne(id);

    this.${collectionVariableName}.splice(this.${collectionVariableName}.indexOf(${entityVariableName}), 1);

    return ${entityVariableName};
  }
}
`,
  ],
  [
    path.join(targetDir, `${moduleName}.service.ts`),
    `import { Injectable } from '@nestjs/common';
import { ${createDtoClassName} } from './dtos/create-${entityName}.dto';
import { ${updateDtoClassName} } from './dtos/update-${entityName}.dto';
import { ${repositoryClassName} } from './${moduleName}.repository';

@Injectable()
export class ${serviceClassName} {
  constructor(private readonly ${collectionVariableName}Repository: ${repositoryClassName}) {}

  create(create${entityClassName}Dto: ${createDtoClassName}) {
    return this.${collectionVariableName}Repository.create(create${entityClassName}Dto);
  }

  findAll() {
    return this.${collectionVariableName}Repository.findAll();
  }

  findOne(id: string) {
    return this.${collectionVariableName}Repository.findOne(id);
  }

  update(id: string, update${entityClassName}Dto: ${updateDtoClassName}) {
    return this.${collectionVariableName}Repository.update(id, update${entityClassName}Dto);
  }

  remove(id: string) {
    return this.${collectionVariableName}Repository.remove(id);
  }
}
`,
  ],
  [
    path.join(targetDir, `${moduleName}.controller.ts`),
    `import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ${createDtoClassName} } from './dtos/create-${entityName}.dto';
import { ${updateDtoClassName} } from './dtos/update-${entityName}.dto';
import { ${serviceClassName} } from './${moduleName}.service';

@Controller('${moduleName}')
export class ${controllerClassName} {
  constructor(private readonly ${collectionVariableName}Service: ${serviceClassName}) {}

  @Post()
  create(@Body() create${entityClassName}Dto: ${createDtoClassName}) {
    return this.${collectionVariableName}Service.create(create${entityClassName}Dto);
  }

  @Get()
  findAll() {
    return this.${collectionVariableName}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${collectionVariableName}Service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() update${entityClassName}Dto: ${updateDtoClassName}) {
    return this.${collectionVariableName}Service.update(id, update${entityClassName}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${collectionVariableName}Service.remove(id);
  }
}
`,
  ],
  [
    path.join(targetDir, `${moduleName}.module.ts`),
    `import { Module } from '@nestjs/common';
import { ${controllerClassName} } from './${moduleName}.controller';
import { ${repositoryClassName} } from './${moduleName}.repository';
import { ${serviceClassName} } from './${moduleName}.service';

@Module({
  controllers: [${controllerClassName}],
  providers: [${serviceClassName}, ${repositoryClassName}],
  exports: [${serviceClassName}],
})
export class ${moduleClassName} {}
`,
  ],
]);

const existingFiles = [...files.keys()].filter((filePath) =>
  fs.existsSync(filePath),
);

if (existingFiles.length > 0 && !force) {
  console.error('Modulo nao criado porque estes arquivos ja existem:');
  existingFiles.forEach((filePath) =>
    console.error(`- ${path.relative(projectDir, filePath)}`),
  );
  console.error('Use --force para sobrescrever.');
  process.exit(1);
}

fs.mkdirSync(dtosDir, { recursive: true });

for (const [filePath, content] of files) {
  fs.writeFileSync(filePath, content, 'utf8');
}

const filesToFormat = [...files.keys()];

if (!skipRegister) {
  const appModulePath = registerModule(moduleName, moduleClassName);

  if (appModulePath) {
    filesToFormat.push(appModulePath);
  }
}

formatFiles(filesToFormat);

console.log(`Modulo ${moduleClassName} criado em src/${moduleName}`);

function registerModule(moduleName, moduleClassName) {
  const appModulePath = path.join(srcDir, 'app.module.ts');

  if (!fs.existsSync(appModulePath)) {
    console.warn(
      'src/app.module.ts nao encontrado. Registro automatico ignorado.',
    );
    return null;
  }

  const importPath = `./${moduleName}/${moduleName}.module`;
  const importStatement = `import { ${moduleClassName} } from '${importPath}';`;
  const importRegex = new RegExp(
    `import\\s+\\{\\s*${moduleClassName}\\s*\\}\\s+from\\s+['"]${escapeRegExp(importPath)}['"];`,
    'm',
  );
  let content = fs.readFileSync(appModulePath, 'utf8');

  if (!importRegex.test(content)) {
    const importMatches = [...content.matchAll(/^import .+;$/gm)];
    const insertIndex =
      importMatches.length > 0
        ? importMatches.at(-1).index + importMatches.at(-1)[0].length
        : 0;
    content = `${content.slice(0, insertIndex)}\n${importStatement}${content.slice(insertIndex)}`;
  }

  content = content.replace(
    /imports:\s*\[([^\]]*)\]/m,
    (match, importsContent) => {
      if (importsContent.includes(moduleClassName)) {
        return match;
      }

      const imports = importsContent.trim();

      if (!imports) {
        return `imports: [${moduleClassName}]`;
      }

      return `imports: [${imports.replace(/,\s*$/, '')}, ${moduleClassName}]`;
    },
  );

  fs.writeFileSync(appModulePath, content, 'utf8');

  return appModulePath;
}

function formatFiles(filePaths) {
  const prettierBinName =
    process.platform === 'win32' ? 'prettier.cmd' : 'prettier';
  const prettierBinPaths = [
    path.join(projectDir, 'node_modules', '.bin', prettierBinName),
    path.join(__dirname, '..', 'node_modules', '.bin', prettierBinName),
  ];
  const prettierBinPath = prettierBinPaths.find((binPath) =>
    fs.existsSync(binPath),
  );

  if (!prettierBinPath) {
    return;
  }

  const result = spawnSync(prettierBinPath, ['--write', ...filePaths], {
    stdio: 'ignore',
  });

  if (result.status !== 0) {
    console.warn(
      'Arquivos criados, mas o Prettier nao conseguiu formatar automaticamente.',
    );
  }
}

function toKebabCase(value) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPascalCase(value) {
  return toKebabCase(value)
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function toCamelCase(value) {
  const pascalCase = toPascalCase(value);

  return `${pascalCase.charAt(0).toLowerCase()}${pascalCase.slice(1)}`;
}

function singularize(value) {
  if (value.endsWith('ies')) {
    return `${value.slice(0, -3)}y`;
  }

  if (/(ses|xes|ches|shes)$/.test(value)) {
    return value.slice(0, -2);
  }

  if (value.endsWith('s') && value.length > 1) {
    return value.slice(0, -1);
  }

  return value;
}
