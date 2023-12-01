package conf

// RedisConfig Redis Server configuration
var RedisConfig = &redis{
	Network:  "tcp",
	Server:   "",
	Password: "",
	DB:       "0",
}

// DatabaseConfig Database configuration
var DatabaseConfig = &database{
	Type:       "UNSET",
	Charset:    "utf8",
	DBFile:     "cloudr.db",
	Port:       3306,
	UnixSocket: false,
}

// SystemConfig General system config
var SystemConfig = &system{
	Debug:       false,
	Mode:        "master",
	Listen:      ":5212",
	ProxyHeader: "X-Forwarded-For",
}

// CORSConfig Cross-domain configuration
var CORSConfig = &cors{
	AllowOrigins:     []string{"UNSET"}, // Default is "UNSET"
	AllowMethods:     []string{"PUT", "POST", "GET", "OPTIONS"},
	AllowHeaders:     []string{"Cookie", "X-Cr-Policy", "Authorization", "Content-Length", "Content-Type", "X-Cr-Path", "X-Cr-FileName"},
	AllowCredentials: false,
	ExposeHeaders:    nil,
	SameSite:         "Default",
	Secure:           false,
}

// SlaveConfig Slave configuration
var SlaveConfig = &slave{
	CallbackTimeout: 20,
	SignatureTTL:    60,
}

var SSLConfig = &ssl{
	Listen:   ":443",
	CertPath: "",
	KeyPath:  "",
}

var UnixConfig = &unix{
	Listen: "",
}

var OptionOverwrite = map[string]interface{}{}
