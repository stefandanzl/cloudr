package main

import (
	"context"
	_ "embed"
	"flag"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/stefandanzl/cloudr/bootstrap"
	model "github.com/stefandanzl/cloudr/models"
	"github.com/stefandanzl/cloudr/pkg/cache"
	"github.com/stefandanzl/cloudr/pkg/conf"
	"github.com/stefandanzl/cloudr/pkg/util"
	"github.com/stefandanzl/cloudr/routers"
)

var (
	isEject    bool
	confPath   string
	scriptName string
)

//go:embed assets.zip
var staticZip string

var staticFS fs.FS

func init() {
	flag.StringVar(&confPath, "c", util.RelativePath("conf.ini"), "Path to the config file.")
	flag.BoolVar(&isEject, "eject", false, "Eject all embedded static files.")
	flag.StringVar(&scriptName, "database-script", "", "Name of database util script.")
	flag.Parse()

	staticFS = bootstrap.NewFS(staticZip)
	bootstrap.Init(confPath, staticFS)
}

func main() {
	// Close database connection
	defer func() {
		if model.DB != nil {
			model.DB.Close()
		}
	}()

	if isEject {
		// Start exporting built-in static resource files
		bootstrap.Eject(staticFS)
		return
	}

	if scriptName != "" {
		// Start running the helper database script
		bootstrap.RunScript(scriptName)
		return
	}

	api := routers.InitRouter()
	api.TrustedPlatform = conf.SystemConfig.ProxyHeader
	server := &http.Server{Handler: api}

	// Shut down the server after receiving the signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM, syscall.SIGHUP, syscall.SIGQUIT)
	go shutdown(sigChan, server)

	defer func() {
		<-sigChan
	}()

	// If SSL is enabled
	if conf.SSLConfig.CertPath != "" {
		util.Log().Info("Listening to %q", conf.SSLConfig.Listen)
		server.Addr = conf.SSLConfig.Listen
		if err := server.ListenAndServeTLS(conf.SSLConfig.CertPath, conf.SSLConfig.KeyPath); err != nil {
			util.Log().Error("Failed to listen to %q: %s", conf.SSLConfig.Listen, err)
			return
		}
	}

	// If Unix is ​​enabled
	if conf.UnixConfig.Listen != "" {
		// delete socket file before listening
		if _, err := os.Stat(conf.UnixConfig.Listen); err == nil {
			if err = os.Remove(conf.UnixConfig.Listen); err != nil {
				util.Log().Error("Failed to delete socket file: %s", err)
				return
			}
		}

		util.Log().Info("Listening to %q", conf.UnixConfig.Listen)
		if err := RunUnix(server); err != nil {
			util.Log().Error("Failed to listen to %q: %s", conf.UnixConfig.Listen, err)
		}
		return
	}

	util.Log().Info("Listening to %q", conf.SystemConfig.Listen)
	server.Addr = conf.SystemConfig.Listen
	if err := server.ListenAndServe(); err != nil {
		util.Log().Error("Failed to listen to %q: %s", conf.SystemConfig.Listen, err)
	}
}

func RunUnix(server *http.Server) error {
	listener, err := net.Listen("unix", conf.UnixConfig.Listen)
	if err != nil {
		return err
	}

	defer listener.Close()
	defer os.Remove(conf.UnixConfig.Listen)

	if conf.UnixConfig.Perm > 0 {
		err = os.Chmod(conf.UnixConfig.Listen, os.FileMode(conf.UnixConfig.Perm))
		if err != nil {
			util.Log().Warning(
				"Failed to set permission to %q for socket file %q: %s",
				conf.UnixConfig.Perm,
				conf.UnixConfig.Listen,
				err,
			)
		}
	}

	return server.Serve(listener)
}

func shutdown(sigChan chan os.Signal, server *http.Server) {
	sig := <-sigChan
	util.Log().Info("Signal %s received, shutting down server...", sig)
	ctx := context.Background()
	if conf.SystemConfig.GracePeriod != 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, time.Duration(conf.SystemConfig.GracePeriod)*time.Second)
		defer cancel()
	}

	// Shutdown http server
	err := server.Shutdown(ctx)
	if err != nil {
		util.Log().Error("Failed to shutdown server: %s", err)
	}

	// Persist in-memory cache
	if err := cache.Store.Persist(filepath.Join(model.GetSettingByName("temp_path"), cache.DefaultCacheFile)); err != nil {
		util.Log().Warning("Failed to persist cache: %s", err)
	}

	close(sigChan)
}
