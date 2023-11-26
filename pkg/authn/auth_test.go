package authn

import (
	"testing"

	"github.com/stefandanzl/cloudr/pkg/cache"
	"github.com/stretchr/testify/assert"
)

func TestInit(t *testing.T) {
	asserts := assert.New(t)
	cache.Set("setting_siteURL", "http://cloudr.org", 0)
	cache.Set("setting_siteName", "Cloudr", 0)
	res, err := NewAuthnInstance()
	asserts.NotNil(res)
	asserts.NoError(err)
}
