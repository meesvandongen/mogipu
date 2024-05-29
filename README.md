# Mogipu

Monorepo Gitlab Image Publisher.

- It checks if the image is already published. (by checking the Gitlab registry)
- If not, it will execute a Gitlab CI job to build and publish the image.

## Installation

```bash
npm install -g mogipu
```

## Usage

```bash
mogipu
```

## Configuration

For each project in your monorepo, a configuration file can be used. The configuration file can take multiple forms:

- a mogipu property in package.json
- a .mogipurc file in JSON or YAML format
- a .mogipurc.json, .mogipurc.yaml, .mogipurc.yml, .mogipurc.js, .mogipurc.ts, .mogipurc.mjs, or .mogipurc.cjs file
- a mogipurc, mogipurc.json, mogipurc.yaml, mogipurc.yml, mogipurc.js, mogipurc.ts, mogipurc.mjs, or mogipurc.cjs file inside a .config subdirectory
- a mogipu.config.js, mogipu.config.ts, mogipu.config.mjs, or mogipu.config.cjs file

### Required Environment Variables

```bash
GITLAB_TOKEN=your-gitlab-token
```

The gitlab token is a Gitlab Access token that has permissions to read the registry.

### Configuration Options

```json
{
  // Required, the path to the dynamic Gitlab CI file part.
  "gitlabCiFile": "path/to/file",
  // Optional, defaults to "gitlab-ci.yml"
  "imageName": "image-name"
}
```

### Project-specific Gitlab CI file

The Gitlab CI file is a normal Gitlab CI file, but with some special variable values that will be replaced by Mogipu. This is the file that is configured in the `gitlabCiFile` property. All the project-specific gitlab files will be merged into one `.gitlab-ci-dynamic.yml` file.

```yaml
release-x:
  # You must use `needs` instead of `stage`.
  needs: []
  # An image used to build the project. For example Kaniko.
  image:
    name: gcr.io/kaniko-project/executor:v1.14.0-debug
    entrypoint: [""]
  # The script to build the project.
  script:
    - /kaniko/executor
      --context "${CI_PROJECT_DIR}${PACKAGE_DIR}"
      --dockerfile "${CI_PROJECT_DIR}${PACKAGE_DIR}/Dockerfile"
      --destination "${CI_REGISTRY_IMAGE}/${PACKAGE_NAME}:${PACKAGE_VERSION}"
  variables:
    # The variables to be replaced in the script.
    PACKAGE_VERSION: __PACKAGE_VERSION__
    PACKAGE_NAME: __PACKAGE_NAME__
    PACKAGE_DIR: __PACKAGE_DIR__
```

### Empty Gitlab CI file

Due to limitations in Gitlab CI, conditional downstream jobs are not possible. To work around this, you can use an empty Gitlab CI file.

**This file needs to exist in the root of your repository, with the name `.gitlab-ci-empty.yml`.**

```yaml
empty:
  image: alpine:latest
  needs: []
  variables:
    # Speed up the pipeline by skipping git clone.
    GIT_STRATEGY: none
  script:
    - echo 'nothing to do here'
```

### Root Gitlab CI file

The root Gitlab CI file is the main Gitlab CI file that will be used to trigger the downstream jobs.

```yaml
release:
  image: oven/bun:latest
  needs: []
  script:
    - bunx mogipu
  artifacts:
    paths:
      - .gitlab-ci-dynamic.yml

deploy:
  needs:
    - "release"
  trigger:
    include:
      - artifact: .gitlab-ci-dynamic.yml
        job: release
    strategy: depend
```
