package model

import (
	"crypto/md5"
	"crypto/sha1"
	"encoding/gob"
	"encoding/hex"
	"encoding/json"
	"strings"

	"github.com/jinzhu/gorm"
	"github.com/pkg/errors"
	"github.com/stefandanzl/cloudr/pkg/util"
)

const (
	// Active 账户正常状态
	Active = iota
	// NotActivicated 未激活
	NotActivicated
	// Baned 被封禁
	Baned
	// OveruseBaned 超额使用被封禁
	OveruseBaned
)

// User 用户模型
type User struct {
	// Table field 表字段
	gorm.Model
	Email     string `gorm:"type:varchar(100);unique_index"`
	Nick      string `gorm:"size:50"`
	Password  string `json:"-"`
	Status    int
	GroupID   uint
	Storage   uint64
	TwoFactor string
	Avatar    string
	Options   string `json:"-" gorm:"size:4294967295"`
	Authn     string `gorm:"size:4294967295"`

	// association model 关联模型
	Group  Group  `gorm:"save_associations:false:false"` //POSSIBLE MISTAKE!
	Policy Policy `gorm:"PRELOAD:false,association_autoupdate:false"`

	// Database ignores fields 数据库忽略字段
	OptionsSerialized UserOption `gorm:"-"`
}

func init() {
	gob.Register(User{})
}

// User personalized configuration fields     UserOption 用户个性化配置字段
type UserOption struct {
	ProfileOff     bool          `json:"profile_off,omitempty"`
	PreferredTheme string        `json:"preferred_theme,omitempty"`
	PdfSettings    PdfSettings   `json:"pdf,omitempty"`
	AudioSettings  AudioSettings `json:"audio,omitempty"`
}

// PDF settings
type PdfSettings struct {
	SavePage         bool                   `json:"savePage"` // Whether to save pages
	PageData         map[string]PDFPageInfo `json:"pageData"` // map of page IDs to their info
	Autosave         bool                   `json:"autosave"`
	SaveButton       bool                   `json:"saveButton"`
	AutosaveInterval int                    `json:"autosaveInterval"`
	ChangePrompt     bool                   `json:"changePrompt"`
}

type PDFPageInfo struct {
	PageNumber int    `json:"page"`
	Path       string `json:"path,omitempty"`
}

// AudioSettings represents user audio playback preferences and history
type AudioSettings struct {
	RemainingTime int               `json:"remainingTime"` // Time threshold in seconds
	SpeedFactor   float64           `json:"speedFactor"`   // Playback speed multiplier
	KeepHistory   int               `json:"keepHistory"`   // Number of entries to keep in history
	SaveInterval  int               `json:"saveInterval"`  // How often to save in seconds
	Last          PlaybackHistory   `json:"last"`
	History       []PlaybackHistory `json:"history"`
}

// PlaybackHistory represents a single audio playback session entry
type PlaybackHistory struct {
	Title     string  `json:"title"`     // Audio file name/title
	Status    string  `json:"status"`    // 'started' or 'ended'
	Src       string  `json:"src"`       // Source path/URL of the audio
	Timestamp float64 `json:"timestamp"` // Last playback position in seconds
	Total     float64 `json:"total"`     // Total duration of audio
}

// Get the user's root directory   Root 获取用户的根目录
func (user *User) Root() (*Folder, error) {
	var folder Folder
	err := DB.Where("parent_id is NULL AND owner_id = ?", user.ID).First(&folder).Error
	return &folder, err
}

// Reduce the user's used capacity     DeductionStorage 减少用户已用容量
func (user *User) DeductionStorage(size uint64) bool {
	if size == 0 {
		return true
	}
	if size <= user.Storage {
		user.Storage -= size
		DB.Model(user).Update("storage", gorm.Expr("storage - ?", size))
		return true
	}
	// If the capacity to be reduced exceeds the used capacity, set to zero     如果要减少的容量超出已用容量，则设为零
	user.Storage = 0
	DB.Model(user).Update("storage", 0)

	return false
}

// IncreaseStorage 检查并增加用户已用容量
func (user *User) IncreaseStorage(size uint64) bool {
	if size == 0 {
		return true
	}
	if size <= user.GetRemainingCapacity() {
		user.Storage += size
		DB.Model(user).Update("storage", gorm.Expr("storage + ?", size))
		return true
	}
	return false
}

// ChangeStorage 更新用户容量
func (user *User) ChangeStorage(tx *gorm.DB, operator string, size uint64) error {
	return tx.Model(user).Update("storage", gorm.Expr("storage "+operator+" ?", size)).Error
}

// IncreaseStorageWithoutCheck 忽略可用容量，增加用户已用容量
func (user *User) IncreaseStorageWithoutCheck(size uint64) {
	if size == 0 {
		return
	}
	user.Storage += size
	DB.Model(user).Update("storage", gorm.Expr("storage + ?", size))

}

// GetRemainingCapacity 获取剩余配额
func (user *User) GetRemainingCapacity() uint64 {
	total := user.Group.MaxStorage
	if total <= user.Storage {
		return 0
	}
	return total - user.Storage
}

// GetPolicyID 获取用户当前的存储策略ID
func (user *User) GetPolicyID(prefer uint) uint {
	if len(user.Group.PolicyList) > 0 {
		return user.Group.PolicyList[0]
	}
	return 0
}

// GetUserByID 用ID获取用户
func GetUserByID(ID interface{}) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).First(&user, ID)
	return user, result.Error
}

// GetActiveUserByID 用ID获取可登录用户
func GetActiveUserByID(ID interface{}) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("status = ?", Active).First(&user, ID)
	return user, result.Error
}

// GetActiveUserByOpenID 用OpenID获取可登录用户
func GetActiveUserByOpenID(openid string) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("status = ? and open_id = ?", Active, openid).Find(&user)
	return user, result.Error
}

// GetUserByEmail 用Email获取用户
func GetUserByEmail(email string) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("email = ?", email).First(&user)
	return user, result.Error
}

// GetActiveUserByEmail 用Email获取可登录用户
func GetActiveUserByEmail(email string) (User, error) {
	var user User
	result := DB.Set("gorm:auto_preload", true).Where("status = ? and email = ?", Active, email).First(&user)
	return user, result.Error
}

// Returns a new empty User     NewUser 返回一个新的空 User
func NewUser() User {
	options := UserOption{}
	return User{
		OptionsSerialized: options,
	}
}

// Save user hook   BeforeSave Save用户前的钩子
func (user *User) BeforeSave() (err error) {
	err = user.SerializeOptions()
	return err
}

// Hook after user creation      AfterCreate 创建用户后的钩子
func (user *User) AfterCreate(tx *gorm.DB) (err error) {
	// Create a user's default root directory  创建用户的默认根目录
	defaultFolder := &Folder{
		Name:    "/",
		OwnerID: user.ID,
	}
	tx.Create(defaultFolder)
	return err
}

// Hook after finding the user       AfterFind 找到用户后的钩子
func (user *User) AfterFind() (err error) {
	// Parse user settings into OptionsSerialized     解析用户设置到OptionsSerialized
	if user.Options != "" {
		err = json.Unmarshal([]byte(user.Options), &user.OptionsSerialized)
	}

	// Preload storage policy     预加载存储策略
	user.Policy, _ = GetPolicyByID(user.GetPolicyID(0))
	return err
}

// Write the Option after the sequence to the database field      SerializeOptions 将序列后的Option写入到数据库字段
func (user *User) SerializeOptions() (err error) {
	optionsValue, err := json.Marshal(&user.OptionsSerialized)
	user.Options = string(optionsValue)
	return err
}

// CheckPassword 根据明文校验密码
func (user *User) CheckPassword(password string) (bool, error) {

	// 根据存储密码拆分为 Salt 和 Digest
	passwordStore := strings.Split(user.Password, ":")
	if len(passwordStore) != 2 && len(passwordStore) != 3 {
		return false, errors.New("Unknown password type")
	}

	// 兼容V2密码，升级后存储格式为: md5:$HASH:$SALT
	if len(passwordStore) == 3 {
		if passwordStore[0] != "md5" {
			return false, errors.New("Unknown password type")
		}
		hash := md5.New()
		_, err := hash.Write([]byte(passwordStore[2] + password))
		bs := hex.EncodeToString(hash.Sum(nil))
		if err != nil {
			return false, err
		}
		return bs == passwordStore[1], nil
	}

	//计算 Salt 和密码组合的SHA1摘要
	hash := sha1.New()
	_, err := hash.Write([]byte(password + passwordStore[0]))
	bs := hex.EncodeToString(hash.Sum(nil))
	if err != nil {
		return false, err
	}

	return bs == passwordStore[1], nil
}

// SetPassword 根据给定明文设定 User 的 Password 字段
func (user *User) SetPassword(password string) error {
	//生成16位 Salt
	salt := util.RandStringRunes(16)

	//计算 Salt 和密码组合的SHA1摘要
	hash := sha1.New()
	_, err := hash.Write([]byte(password + salt))
	bs := hex.EncodeToString(hash.Sum(nil))

	if err != nil {
		return err
	}

	//存储 Salt 值和摘要， ":"分割
	user.Password = salt + ":" + string(bs)
	return nil
}

// NewAnonymousUser 返回一个匿名用户
func NewAnonymousUser() *User {
	user := User{}
	user.Policy.Type = "anonymous"
	user.Group, _ = GetGroupByID(3)
	return &user
}

// IsAnonymous 返回是否为未登录用户
func (user *User) IsAnonymous() bool {
	return user.ID == 0
}

// SetStatus 设定用户状态
func (user *User) SetStatus(status int) {
	DB.Model(&user).Update("status", status)
}

// Update user    Update 更新用户
func (user *User) Update(val map[string]interface{}) error {
	return DB.Model(user).Updates(val).Error
}

// Update user preferences     UpdateOptions 更新用户偏好设定
func (user *User) UpdateOptions() error {
	if err := user.SerializeOptions(); err != nil {
		return err
	}
	return user.Update(map[string]interface{}{"options": user.Options})
}
