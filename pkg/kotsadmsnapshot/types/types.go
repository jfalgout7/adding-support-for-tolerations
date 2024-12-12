package types

import (
	"strconv"
	"time"

	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"
)

const (
	// InstanceBackupNameLabel is the label used to store the name of the backup for an instance
	// backup.
	InstanceBackupNameLabel = "replicated.com/backup-name"
	// InstanceBackupTypeAnnotation is the annotation used to store the type of backup for an
	// instance backup.
	InstanceBackupTypeAnnotation = "replicated.com/backup-type"
	// InstanceBackupCountAnnotation is the annotation used to store the expected number of backups
	// for an instance backup.
	InstanceBackupCountAnnotation = "replicated.com/backup-count"
	// InstanceBackupRestoreSpecAnnotation is the annotation used to store the corresponding restore
	// spec for an instance backup.
	InstanceBackupRestoreSpecAnnotation = "replicated.com/restore-spec"

	// InstanceBackupTypeInfra indicates that the backup is of type infrastructure.
	InstanceBackupTypeInfra = "infra"
	// InstanceBackupTypeApp indicates that the backup is of type application.
	InstanceBackupTypeApp = "app"
	// InstanceBackupTypeLegacy indicates that the backup is of type legacy (infra + app).
	InstanceBackupTypeLegacy = "legacy"

	// InstanceBackupAnnotation is the annotation used to indicate that a backup is a legacy
	// instance backup.
	InstanceBackupAnnotation = "kots.io/instance"

	// InstanceBackupVersionAnnotation is the annotation used to store the version of the backup
	// for an instance (DR) backup.
	InstanceBackupVersionAnnotation = "replicated.com/disaster-recovery-version"
	// InstanceBackupVersion1 indicates that the backup is of version 1.
	InstanceBackupVersion1 = "1"
	// InstanceBackupVersionCurrent is the current backup version. When future breaking changes are
	// introduced, we can increment this number on backup creation.
	InstanceBackupVersionCurrent = InstanceBackupVersion1
)

type App struct {
	Slug       string `json:"slug"`
	Sequence   int64  `json:"sequence"`
	Name       string `json:"name"`
	AppIconURI string `json:"iconUri"`
}

// ReplicatedBackup holds both the infrastructure and app backups for an EC cluster
type ReplicatedBackup struct {
	Name string `json:"name"`
	// number of backups expected to exist for the ReplicatedBackup to be considered complete
	ExpectedBackupCount int      `json:"expectedBackupCount"`
	Backups             []Backup `json:"backups"`
}

type Backup struct {
	Name               string     `json:"name"`
	Status             string     `json:"status"`
	Trigger            string     `json:"trigger"`
	AppID              string     `json:"appID"`    // TODO: remove with app backups
	Sequence           int64      `json:"sequence"` // TODO: remove with app backups
	StartedAt          *time.Time `json:"startedAt,omitempty"`
	FinishedAt         *time.Time `json:"finishedAt,omitempty"`
	ExpiresAt          *time.Time `json:"expiresAt,omitempty"`
	VolumeCount        int        `json:"volumeCount"`
	VolumeSuccessCount int        `json:"volumeSuccessCount"`
	VolumeBytes        int64      `json:"volumeBytes"`
	VolumeSizeHuman    string     `json:"volumeSizeHuman"`
	SupportBundleID    string     `json:"supportBundleId,omitempty"`
	IncludedApps       []App      `json:"includedApps,omitempty"`
}

type BackupDetail struct {
	Name            string           `json:"name"`
	Status          string           `json:"status"`
	VolumeSizeHuman string           `json:"volumeSizeHuman"`
	Namespaces      []string         `json:"namespaces"`
	Hooks           []*SnapshotHook  `json:"hooks"`
	Volumes         []SnapshotVolume `json:"volumes"`
	Errors          []SnapshotError  `json:"errors"`
	Warnings        []SnapshotError  `json:"warnings"`
}

type RestoreDetail struct {
	Name     string                `json:"name"`
	Phase    velerov1.RestorePhase `json:"phase"`
	Volumes  []RestoreVolume       `json:"volumes"`
	Errors   []SnapshotError       `json:"errors"`
	Warnings []SnapshotError       `json:"warnings"`
}

type SnapshotHook struct {
	Name          string          `json:"name"`
	Namespace     string          `json:"namespace"`
	Phase         string          `json:"phase"`
	PodName       string          `json:"podName"`
	ContainerName string          `json:"containerName"`
	Command       string          `json:"command"`
	Stdout        string          `json:"stdout"`
	Stderr        string          `json:"stderr"`
	StartedAt     *time.Time      `json:"startedAt,omitempty"`
	FinishedAt    *time.Time      `json:"finishedAt,omitempty"`
	Errors        []SnapshotError `json:"errors"`
	Warnings      []SnapshotError `json:"warnings"`
}

type SnapshotVolume struct {
	Name                 string     `json:"name"`
	PodName              string     `json:"podName"`
	PodNamespace         string     `json:"podNamespace"`
	PodVolumeName        string     `json:"podVolumeName"`
	SizeBytesHuman       string     `json:"sizeBytesHuman"`
	DoneBytesHuman       string     `json:"doneBytesHuman"`
	CompletionPercent    int        `json:"completionPercent"`
	TimeRemainingSeconds int        `json:"timeRemainingSeconds"`
	StartedAt            *time.Time `json:"startedAt,omitempty"`
	FinishedAt           *time.Time `json:"finishedAt,omitempty"`
	Phase                string     `json:"phase"`
}
type RestoreVolume struct {
	Name                  string     `json:"name"`
	PodName               string     `json:"podName"`
	PodNamespace          string     `json:"podNamespace"`
	PodVolumeName         string     `json:"podVolumeName"`
	SizeBytesHuman        string     `json:"sizeBytesHuman"`
	DoneBytesHuman        string     `json:"doneBytesHuman"`
	CompletionPercent     int        `json:"completionPercent"`
	RemainingSecondsExist bool       `json:"remainingSecondsExist"`
	TimeRemainingSeconds  int        `json:"timeRemainingSeconds"`
	StartedAt             *time.Time `json:"startedAt,omitempty"`
	FinishedAt            *time.Time `json:"finishedAt,omitempty"`
	Phase                 string     `json:"phase"`
}

type SnapshotError struct {
	Title     string `json:"title"`
	Message   string `json:"message"`
	Namespace string `json:"namespace"`
}

type VolumeSummary struct {
	VolumeCount        int    `json:"volumeCount"`
	VolumeSuccessCount int    `json:"volumeSuccessCount"`
	VolumeBytes        int64  `json:"volumeBytes"`
	VolumeSizeHuman    string `json:"volumeSizeHuman"`
}

type SnapshotSchedule struct {
	Schedule string `json:"schedule"`
}

type SnapshotTTL struct {
	InputValue    string `json:"inputValue"`
	InputTimeUnit string `json:"inputTimeUnit"`
	Converted     string `json:"converted"`
}

type ParsedTTL struct {
	Quantity int64  `json:"quantity"`
	Unit     string `json:"unit"`
}

type ScheduledSnapshot struct {
	ID                 string    `json:"id"`
	AppID              string    `json:"appId"`
	ScheduledTimestamp time.Time `json:"scheduledTimestamp"`
	// name of Backup CR will be set once scheduled
	BackupName string `json:"backupName,omitempty"`
}

type ScheduledInstanceSnapshot struct {
	ID                 string    `json:"id"`
	ClusterID          string    `json:"clusterId"`
	ScheduledTimestamp time.Time `json:"scheduledTimestamp"`
	// name of Backup CR will be set once scheduled
	BackupName string `json:"backupName,omitempty"`
}

// GetBackupName returns the name of the backup from the velero backup object label.
func GetBackupName(veleroBackup velerov1.Backup) string {
	if val, ok := veleroBackup.GetLabels()[InstanceBackupNameLabel]; ok {
		return val
	}
	return veleroBackup.GetName()
}

// IsInstanceBackup returns true if the backup is an instance backup.
func IsInstanceBackup(veleroBackup velerov1.Backup) bool {
	if GetInstanceBackupVersion(veleroBackup) != "" {
		return true
	}
	if val, ok := veleroBackup.GetAnnotations()[InstanceBackupAnnotation]; ok {
		return val == "true"
	}
	return false
}

// GetInstanceBackupVersion returns the version of the backup from the velero backup object
// annotation.
func GetInstanceBackupVersion(veleroBackup velerov1.Backup) string {
	if val, ok := veleroBackup.GetAnnotations()[InstanceBackupVersionAnnotation]; ok {
		return val
	}
	return ""
}

// GetInstanceBackupType returns the type of the backup from the velero backup object annotation.
func GetInstanceBackupType(veleroBackup velerov1.Backup) string {
	if val, ok := veleroBackup.GetAnnotations()[InstanceBackupTypeAnnotation]; ok {
		return val
	}
	return InstanceBackupTypeLegacy
}

// GetInstanceBackupCount returns the expected number of backups from the velero backup object
// annotation.
func GetInstanceBackupCount(veleroBackup velerov1.Backup) int {
	if val, ok := veleroBackup.GetAnnotations()[InstanceBackupCountAnnotation]; ok {
		num, _ := strconv.Atoi(val)
		if num > 0 {
			return num
		}
	}
	return 1
}
