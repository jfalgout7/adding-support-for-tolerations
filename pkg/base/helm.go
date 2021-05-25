package base

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/ghodss/yaml"
	"github.com/pkg/errors"
	upstreamtypes "github.com/replicatedhq/kots/pkg/upstream/types"
	"github.com/replicatedhq/kots/pkg/util"
	"helm.sh/helm/v3/pkg/strvals"
)

func RenderHelm(u *upstreamtypes.Upstream, renderOptions *RenderOptions) (*Base, error) {
	chartPath, err := ioutil.TempDir("", "kots")
	if err != nil {
		return nil, errors.Wrap(err, "failed to create chart dir")
	}
	defer os.RemoveAll(chartPath)

	for _, file := range u.Files {
		p := path.Join(chartPath, file.Path)
		d, fileName := path.Split(p)
		if _, err := os.Stat(d); err != nil {
			if os.IsNotExist(err) {
				if err := os.MkdirAll(d, 0744); err != nil {
					return nil, errors.Wrap(err, "failed to mkdir for chart resource")
				}
			} else {
				return nil, errors.Wrap(err, "failed to check if dir exists")
			}
		}

		// check chart.yaml for Helm version if a helm version has not been explicitly provided
		if strings.EqualFold(fileName, "Chart.yaml") && renderOptions.HelmVersion == "" {
			renderOptions.HelmVersion, err = checkChartForVersion(&file)
		}

		if err := ioutil.WriteFile(p, file.Content, 0644); err != nil {
			return nil, errors.Wrap(err, "failed to write chart file")
		}
	}

	vals := renderOptions.HelmValues
	for _, value := range renderOptions.HelmOptions {
		if err := strvals.ParseInto(value, vals); err != nil {
			return nil, errors.Wrapf(err, "failed to parse helm value %q", value)
		}
	}

	var rendered map[string]string
	switch strings.ToLower(renderOptions.HelmVersion) {
	case "v3":
		rendered, err = renderHelmV3(u.Name, chartPath, vals, renderOptions)
		if err != nil {
			return nil, errors.Wrap(err, "failed to render with helm v3")
		}
	case "v2", "":
		rendered, err = renderHelmV2(u.Name, chartPath, vals, renderOptions)
		if err != nil {
			return nil, errors.Wrap(err, "failed to render with helm v2")
		}
	default:
		return nil, errors.Errorf("unknown helmVersion %s", renderOptions.HelmVersion)
	}

	baseFiles := []BaseFile{}
	for k, v := range rendered {
		if !renderOptions.SplitMultiDocYAML {
			baseFile := BaseFile{
				Path:    k,
				Content: []byte(v),
			}
			if err := baseFile.transpileHelmHooksToKotsHooks(); err != nil {
				return nil, errors.Wrap(err, "failed to transpile helm hooks to kots hooks")
			}

			baseFiles = append(baseFiles, baseFile)
			continue
		}

		fileStrings := strings.Split(v, "\n---\n")
		if len(fileStrings) == 1 {
			baseFile := BaseFile{
				Path:    k,
				Content: []byte(v),
			}
			if err := baseFile.transpileHelmHooksToKotsHooks(); err != nil {
				return nil, errors.Wrap(err, "failed to transpile helm hooks to kots hooks")
			}

			baseFiles = append(baseFiles, baseFile)
			continue
		}

		for idx, fileString := range fileStrings {
			filename := strings.TrimSuffix(k, filepath.Ext(k))
			filename = fmt.Sprintf("%s-%d%s", filename, idx+1, filepath.Ext(k))

			baseFile := BaseFile{
				Path:    filename,
				Content: []byte(fileString),
			}
			if err := baseFile.transpileHelmHooksToKotsHooks(); err != nil {
				return nil, errors.Wrap(err, "failed to transpile helm hooks to kots hooks")
			}

			baseFiles = append(baseFiles, baseFile)
		}
	}

	// remove any common prefix from all files
	if len(baseFiles) > 0 {
		firstFileDir, _ := path.Split(baseFiles[0].Path)
		commonPrefix := strings.Split(firstFileDir, string(os.PathSeparator))

		for _, file := range baseFiles {
			d, _ := path.Split(file.Path)
			dirs := strings.Split(d, string(os.PathSeparator))

			commonPrefix = util.CommonSlicePrefix(commonPrefix, dirs)
		}

		cleanedBaseFiles := []BaseFile{}
		for _, file := range baseFiles {
			d, f := path.Split(file.Path)
			d2 := strings.Split(d, string(os.PathSeparator))

			cleanedBaseFile := file
			d2 = d2[len(commonPrefix):]
			cleanedBaseFile.Path = path.Join(path.Join(d2...), f)

			cleanedBaseFiles = append(cleanedBaseFiles, cleanedBaseFile)
		}

		baseFiles = cleanedBaseFiles
	}

	return &Base{
		Files: baseFiles,
	}, nil
}

func checkChartForVersion(file *upstreamtypes.UpstreamFile) (string, error) {
	var chartValues map[string]interface{}
	err := yaml.Unmarshal(file.Content, &chartValues)
	if err != nil {
		return "", errors.Wrap(err, "failed to unmarshal chart.yaml")
	}
	// note: helm API version 2 is equivilent to Helm V3
	if version := chartValues["apiVersion"]; strings.EqualFold(version.(string), "v2") {
		return "v3", nil
	}
	if _, ok := chartValues["dependencies"]; ok {
		return "v3", nil
	}

	// if no determination is made, assume v2 until default changes
	return "v2", nil
}
