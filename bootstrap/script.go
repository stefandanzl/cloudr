package bootstrap

import (
	"context"
	"github.com/stefandanzl/cloudr/models/scripts/invoker"
	"github.com/stefandanzl/cloudr/pkg/util"
)

func RunScript(name string) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	if err := invoker.RunDBScript(name, ctx); err != nil {
		util.Log().Error("Failed to execute database script: %s", err)
		return
	}

	util.Log().Info("Finish executing database script %q.", name)
}
