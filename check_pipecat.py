import sys
try:
    import pipecat
    print(f"Pipecat module found: {pipecat.__file__}")
    
    try:
        from pipecat.pipeline.pipeline import PipelineParams
        print("PipelineParams found in pipecat.pipeline.pipeline")
    except ImportError:
        print("PipelineParams NOT found in pipecat.pipeline.pipeline")

    try:
        from pipecat.pipeline.task import PipelineParams
        print("PipelineParams found in pipecat.pipeline.task")
    except ImportError:
        print("PipelineParams NOT found in pipecat.pipeline.task")

    import pipecat.pipeline.task
    if hasattr(pipecat.pipeline.task.PipelineTask, 'Params'):
         print("PipelineTask.Params EXISTS")
    else:
         print("PipelineTask.Params DOES NOT EXIST")

except ImportError:
    print("Pipecat not installed")
