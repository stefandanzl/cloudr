package user

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/pquerna/otp/totp"

	model "github.com/stefandanzl/cloudr/models"
	"github.com/stefandanzl/cloudr/pkg/serializer"
	"github.com/stefandanzl/cloudr/pkg/util"
)

// SettingService 通用设置服务
type SettingService struct {
}

// SettingListService 通用设置列表服务
type SettingListService struct {
	Page int `form:"page" binding:"required,min=1"`
}

// AvatarService 头像服务
type AvatarService struct {
	Size string `uri:"size" binding:"required,eq=l|eq=m|eq=s"`
}

// ################          settings change service           SettingUpdateService 设定更改服务
type SettingUpdateService struct {
	Option string `uri:"option" binding:"required,eq=nick|eq=theme|eq=homepage|eq=vip|eq=qq|eq=policy|eq=password|eq=2fa|eq=authn|eq=pdf|eq=audio"`
}

// Property change interface      ######################            OptionsChangeHandler 属性更改接口
type OptionsChangeHandler interface {
	Update(*gin.Context, *model.User) serializer.Response
}

// ChangerNick 昵称更改服务
type ChangerNick struct {
	Nick string `json:"nick" binding:"required,min=1,max=255"`
}

// PolicyChange 更改存储策略
type PolicyChange struct {
	ID string `json:"id" binding:"required"`
}

// HomePage 更改个人主页开关
type HomePage struct {
	Enabled bool `json:"status"`
}

// PasswordChange 更改密码
type PasswordChange struct {
	Old string `json:"old" binding:"required,min=4,max=64"`
	New string `json:"new" binding:"required,min=4,max=64"`
}

// Enable2FA 开启二步验证
type Enable2FA struct {
	Code string `json:"code" binding:"required"`
}

// DeleteWebAuthn 删除WebAuthn凭证
type DeleteWebAuthn struct {
	ID string `json:"id" binding:"required"`
}

// ThemeChose 主题选择
type ThemeChose struct {
	Theme string `json:"theme" binding:"required,hexcolor|rgb|rgba|hsl"`
}

type PdfSettingsService struct {
	PdfSettings model.PdfSettings `json:"pdf"`
}

func (service *PdfSettingsService) Update(c *gin.Context, user *model.User) serializer.Response {

	// Get current settings
	currentSettings := user.OptionsSerialized.PdfSettings

	// Only update fields that are provided in the request
	if service.PdfSettings.PageData != nil {
		// If entire pages map is provided, update it

		// Initialize map if it doesn't exist
		if currentSettings.PageData == nil || len(service.PdfSettings.PageData) == 0 {
			currentSettings.PageData = make(map[string]model.PDFPageInfo)
		}

		// Handle individual page updates if provided
		for pageID, pageInfo := range service.PdfSettings.PageData {
			if pageInfo.PageNumber != 0 || pageInfo.Path != "" {
				currentSettings.PageData[pageID] = pageInfo
			}
		}
	}

	if service.PdfSettings.SavePage {
		currentSettings.SavePage = service.PdfSettings.SavePage
	}

	// Update other fields only if they are provided
	if service.PdfSettings.Autosave {
		currentSettings.Autosave = service.PdfSettings.Autosave
	}
	if service.PdfSettings.SaveButton {
		currentSettings.SaveButton = service.PdfSettings.SaveButton
	}
	if service.PdfSettings.AutosaveInterval != 0 {
		currentSettings.AutosaveInterval = service.PdfSettings.AutosaveInterval
	}
	if service.PdfSettings.ChangePrompt {
		currentSettings.ChangePrompt = service.PdfSettings.ChangePrompt
	}

	user.OptionsSerialized.PdfSettings = currentSettings
	if err := user.UpdateOptions(); err != nil {
		return serializer.DBErr("Failed to update user preferences", err)
	}

	return serializer.Response{}
}

type AudioSettingsService struct {
	AudioSettings model.AudioSettings `json:"audio"`
}

func (service *AudioSettingsService) Update(c *gin.Context, user *model.User) serializer.Response {
	// Get current settings
	currentSettings := user.OptionsSerialized.AudioSettings

	// Only update fields that are provided in the request
	if service.AudioSettings.Last.Src != "" {
		currentSettings.Last = service.AudioSettings.Last
	}
	if service.AudioSettings.SpeedFactor != 0 {
		currentSettings.SpeedFactor = service.AudioSettings.SpeedFactor
	}
	if service.AudioSettings.RemainingTime != 0 {
		currentSettings.RemainingTime = service.AudioSettings.RemainingTime
	}
	if service.AudioSettings.SaveInterval != 0 {
		currentSettings.SaveInterval = service.AudioSettings.SaveInterval
	}
	if service.AudioSettings.KeepHistory != 0 {
		currentSettings.KeepHistory = service.AudioSettings.KeepHistory
	}
	if service.AudioSettings.History != nil {
		currentSettings.History = service.AudioSettings.History
	}

	user.OptionsSerialized.AudioSettings = currentSettings
	if err := user.UpdateOptions(); err != nil {
		return serializer.DBErr("Failed to update user preferences", err)
	}

	return serializer.Response{}
}

// Update theme settings     Update 更新主题设定
func (service *ThemeChose) Update(c *gin.Context, user *model.User) serializer.Response {
	user.OptionsSerialized.PreferredTheme = service.Theme
	if err := user.UpdateOptions(); err != nil {
		return serializer.DBErr("Failed to update user preferences", err)
	}

	return serializer.Response{}
}

// Delete credentials      Update 删除凭证
func (service *DeleteWebAuthn) Update(c *gin.Context, user *model.User) serializer.Response {
	user.RemoveAuthn(service.ID)
	return serializer.Response{}
}

// Change 2-step verification settings     Update 更改二步验证设定
func (service *Enable2FA) Update(c *gin.Context, user *model.User) serializer.Response {
	if user.TwoFactor == "" {
		// 开启2FA
		secret, ok := util.GetSession(c, "2fa_init").(string)
		if !ok {
			return serializer.Err(serializer.CodeInternalSetting, "You have not initiated 2FA session", nil)
		}

		if !totp.Validate(service.Code, secret) {
			return serializer.ParamErr("Incorrect 2FA code", nil)
		}

		if err := user.Update(map[string]interface{}{"two_factor": secret}); err != nil {
			return serializer.DBErr("Failed to update user preferences", err)
		}

	} else {
		// 关闭2FA
		if !totp.Validate(service.Code, user.TwoFactor) {
			return serializer.ParamErr("Incorrect 2FA code", nil)
		}

		if err := user.Update(map[string]interface{}{"two_factor": ""}); err != nil {
			return serializer.DBErr("Failed to update user preferences", err)
		}
	}

	return serializer.Response{}
}

// Init2FA 初始化二步验证
func (service *SettingService) Init2FA(c *gin.Context, user *model.User) serializer.Response {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Cloudr",
		AccountName: user.Email,
	})
	if err != nil {
		return serializer.Err(serializer.CodeInternalSetting, "Failed to generate TOTP secret", err)
	}

	util.SetSession(c, map[string]interface{}{"2fa_init": key.Secret()})
	return serializer.Response{Data: key.Secret()}
}

// change password    Update 更改密码
func (service *PasswordChange) Update(c *gin.Context, user *model.User) serializer.Response {
	// 验证老密码
	if ok, _ := user.CheckPassword(service.Old); !ok {
		return serializer.Err(serializer.CodeIncorrectPassword, "", nil)
	}

	// 更改为新密码
	user.SetPassword(service.New)
	if err := user.Update(map[string]interface{}{"password": user.Password}); err != nil {
		return serializer.DBErr("Failed to update password", err)
	}

	return serializer.Response{}
}

// Toggle personal home page switch     Update 切换个人主页开关
func (service *HomePage) Update(c *gin.Context, user *model.User) serializer.Response {
	user.OptionsSerialized.ProfileOff = !service.Enabled
	if err := user.UpdateOptions(); err != nil {
		return serializer.DBErr("Failed to update user preferences", err)
	}

	return serializer.Response{}
}

// Change nickname         Update 更改昵称
func (service *ChangerNick) Update(c *gin.Context, user *model.User) serializer.Response {
	if err := user.Update(map[string]interface{}{"nick": service.Nick}); err != nil {
		return serializer.DBErr("Failed to update user", err)
	}

	return serializer.Response{}
}

// Get user avatar          Get 获取用户头像
func (service *AvatarService) Get(c *gin.Context) serializer.Response {
	// 查找目标用户
	uid, _ := c.Get("object_id")
	user, err := model.GetActiveUserByID(uid.(uint))
	if err != nil {
		return serializer.Err(serializer.CodeUserNotFound, "", err)
	}

	// 未设定头像时，返回404错误
	if user.Avatar == "" {
		c.Status(404)
		return serializer.Response{}
	}

	// 获取头像设置
	sizes := map[string]string{
		"s": model.GetSettingByName("avatar_size_s"),
		"m": model.GetSettingByName("avatar_size_m"),
		"l": model.GetSettingByName("avatar_size_l"),
	}

	// Gravatar 头像重定向
	if user.Avatar == "gravatar" {
		server := model.GetSettingByName("gravatar_server")
		gravatarRoot, err := url.Parse(server)
		if err != nil {
			return serializer.Err(serializer.CodeInternalSetting, "Failed to parse Gravatar server", err)
		}
		email_lowered := strings.ToLower(user.Email)
		has := md5.Sum([]byte(email_lowered))
		avatar, _ := url.Parse(fmt.Sprintf("/avatar/%x?d=mm&s=%s", has, sizes[service.Size]))

		return serializer.Response{
			Code: -301,
			Data: gravatarRoot.ResolveReference(avatar).String(),
		}
	}

	// 本地文件头像
	if user.Avatar == "file" {
		avatarRoot := util.RelativePath(model.GetSettingByName("avatar_path"))
		sizeToInt := map[string]string{
			"s": "0",
			"m": "1",
			"l": "2",
		}

		avatar, err := os.Open(filepath.Join(avatarRoot, fmt.Sprintf("avatar_%d_%s.png", user.ID, sizeToInt[service.Size])))
		if err != nil {
			c.Status(404)
			return serializer.Response{}
		}
		defer avatar.Close()

		http.ServeContent(c.Writer, c.Request, "avatar.png", user.UpdatedAt, avatar)
		return serializer.Response{}
	}

	c.Status(404)
	return serializer.Response{}
}

// ListTasks 列出任务
func (service *SettingListService) ListTasks(c *gin.Context, user *model.User) serializer.Response {
	tasks, total := model.ListTasks(user.ID, service.Page, 10, "updated_at desc")
	return serializer.BuildTaskList(tasks, total)
}

// Get user settings          Settings 获取用户设定
func (service *SettingService) Settings(c *gin.Context, user *model.User) serializer.Response {
	return serializer.Response{
		Data: map[string]interface{}{
			"uid":          user.ID,
			"homepage":     !user.OptionsSerialized.ProfileOff,
			"two_factor":   user.TwoFactor != "",
			"prefer_theme": user.OptionsSerialized.PreferredTheme,
			"themes":       model.GetSettingByName("themes"),
			"authn":        serializer.BuildWebAuthnList(user.WebAuthnCredentials()),
			"pdf":          user.OptionsSerialized.PdfSettings,
			"audio":        user.OptionsSerialized.AudioSettings,
		},
	}
}
